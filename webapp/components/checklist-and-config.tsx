"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle, Loader2 } from "lucide-react";
import { PhoneNumber } from "@/components/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Replace window references with a safe approach that only runs on client
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export default function ChecklistAndConfig({
  ready,
  setReady,
  selectedPhoneNumber,
  setSelectedPhoneNumber,
}: {
  ready: boolean;
  setReady: (val: boolean) => void;
  selectedPhoneNumber: string;
  setSelectedPhoneNumber: (val: string) => void;
}) {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [currentNumberSid, setCurrentNumberSid] = useState("");
  const [currentVoiceUrl, setCurrentVoiceUrl] = useState("");

  const [publicUrl, setPublicUrl] = useState(process.env.PUBLIC_URL || "http://localhost:8081");
  const [localServerUp, setLocalServerUp] = useState(false);
  const [publicUrlAccessible, setPublicUrlAccessible] = useState(false);

  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Use the direct twiml endpoint
  const [appendedTwimlUrl, setAppendedTwimlUrl] = useState('');
  
  useEffect(() => {
    // Set this only after component mounts (client-side)
    setAppendedTwimlUrl(`${getBaseUrl()}/twiml`);
  }, []);

  const isWebhookMismatch =
    appendedTwimlUrl && currentVoiceUrl && appendedTwimlUrl !== currentVoiceUrl;

  // Load saved configuration on component mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('switchboardConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.publicUrl) {
          setPublicUrl(config.publicUrl);
        }
        if (config.selectedPhoneNumber) {
          setSelectedPhoneNumber(config.selectedPhoneNumber);
        }
        if (config.ready) {
          setReady(config.ready);
        }
      }
    } catch (err) {
      console.error("Error loading saved configuration:", err);
    }
  }, [setReady, setSelectedPhoneNumber]);

  useEffect(() => {
    let polling = true;

    const pollChecks = async () => {
      try {
        // 1. Check credentials
        let res = await fetch("/api/twilio");
        if (!res.ok) throw new Error("Failed credentials check");
        const credData = await res.json();
        setHasCredentials(!!credData?.credentialsSet);

        // 2. Fetch numbers
        res = await fetch("/api/twilio/numbers");
        if (!res.ok) throw new Error("Failed to fetch phone numbers");
        const numbersData = await res.json();
        if (Array.isArray(numbersData) && numbersData.length > 0) {
          setPhoneNumbers(numbersData);
          // If currentNumberSid not set or not in the list, use first
          const selected =
            numbersData.find((p: PhoneNumber) => p.sid === currentNumberSid) ||
            numbersData[0];
          setCurrentNumberSid(selected.sid);
          setCurrentVoiceUrl(selected.voiceUrl || "");
          setSelectedPhoneNumber(selected.friendlyName || "");
        }

        // 3. Try to get public URL if not already set
        if (!publicUrl) {
          try {
            // Try from browser location first (for Cloud Run deployment)
            const host = getBaseUrl();
            setPublicUrl(host);
            
            // Alternatively, could try to fetch from the server
            const apiUrl = "/api/webhook-local"; // Could create this endpoint to return the public URL
            res = await fetch(apiUrl);
            if (res.ok) {
              const data = await res.json();
              if (data.publicUrl) {
                setPublicUrl(data.publicUrl);
              }
            }
          } catch (err) {
            console.error("Error fetching public URL:", err);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    pollChecks();
    const intervalId = setInterval(() => polling && pollChecks(), 1000);
    return () => {
      polling = false;
      clearInterval(intervalId);
    };
  }, [currentNumberSid, setSelectedPhoneNumber, publicUrl]);

  const updateWebhook = async () => {
    if (!currentNumberSid || !publicUrl) return;
    // Use getBaseUrl() instead of direct window reference
    const baseUrl = getBaseUrl();
    const webhookUrl = `${baseUrl}/twiml`;
    try {
      setWebhookLoading(true);
      const res = await fetch("/api/twilio/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberSid: currentNumberSid,
          voiceUrl: webhookUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to update webhook");
      setCurrentVoiceUrl(webhookUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setWebhookLoading(false);
    }
  };

  const checkConnection = async () => {
    if (!publicUrl) return;
    setConnectionLoading(true);
    let success = false;
    for (let i = 0; i < 5; i++) {
      try {
        // Use the direct path to the public-url endpoint
        const resTest = await fetch(`/public-url`);
        if (resTest.ok) {
          const data = await resTest.json();
          setPublicUrlAccessible(true);
          setLocalServerUp(true);
          success = true;
          break;
        }
      } catch {
        // retry
      }
      if (i < 4) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    if (!success) {
      setPublicUrlAccessible(false);
    }
    setConnectionLoading(false);
  };

  const checklist = useMemo(() => {
    return [
      {
        label: "Set up Twilio account",
        done: hasCredentials,
        description: "Then update account details in webapp/.env",
        field: (
          <Button
            className="w-full"
            onClick={() => window.open("https://console.twilio.com/", "_blank")}
          >
            Open Twilio Console
          </Button>
        ),
      },
      {
        label: "Set up Twilio phone number",
        done: phoneNumbers.length > 0,
        description: "Costs around $1.15/month",
        field:
          phoneNumbers.length > 0 ? (
            phoneNumbers.length === 1 ? (
              <Input value={phoneNumbers[0].friendlyName || ""} disabled />
            ) : (
              <Select
                onValueChange={(value) => {
                  setCurrentNumberSid(value);
                  const selected = phoneNumbers.find((p) => p.sid === value);
                  if (selected) {
                    setSelectedPhoneNumber(selected.friendlyName || "");
                    setCurrentVoiceUrl(selected.voiceUrl || "");
                  }
                }}
                value={currentNumberSid}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {phoneNumbers.map((phone) => (
                    <SelectItem key={phone.sid} value={phone.sid}>
                      {phone.friendlyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          ) : (
            <Button
              className="w-full"
              onClick={() =>
                window.open(
                  "https://console.twilio.com/us1/develop/phone-numbers/manage/incoming",
                  "_blank"
                )
              }
            >
              Set up Twilio phone number
            </Button>
          ),
      },
      {
        label: "WebSocket server",
        done: localServerUp,
        description: "Cloud Run server running on ports 8080/8081",
        field: (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <Input 
                value={publicUrl} 
                onChange={(e) => setPublicUrl(e.target.value)} 
                placeholder="Public URL (from Cloud Run)"
              />
            </div>
            <div className="flex-1">
              <Button
                variant="outline"
                onClick={checkConnection}
                className="w-full bg-black text-white"
              >
                {connectionLoading ? (
                  <Loader2 className="mr-2 h-4 animate-spin" />
                ) : (
                  "Check Connection"
                )}
              </Button>
            </div>
          </div>
        ),
      },
      {
        label: "Update Twilio webhook URL",
        done: !!publicUrl && !isWebhookMismatch,
        description: "Can also be done manually in Twilio console",
        field: (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <Input 
                value={`${getBaseUrl()}/twiml`}
                disabled
                className="w-full" 
              />
            </div>
            <div className="flex-1">
              <Button
                onClick={updateWebhook}
                disabled={webhookLoading || !publicUrl}
                className="w-full"
              >
                {webhookLoading ? (
                  <Loader2 className="mr-2 h-4 animate-spin" />
                ) : (
                  "Update Webhook"
                )}
              </Button>
            </div>
          </div>
        ),
      },
    ];
  }, [
    hasCredentials,
    phoneNumbers,
    currentNumberSid,
    localServerUp,
    publicUrl,
    publicUrlAccessible,
    currentVoiceUrl,
    isWebhookMismatch,
    appendedTwimlUrl,
    webhookLoading,
    connectionLoading,
    setSelectedPhoneNumber,
  ]);

  useEffect(() => {
    setAllChecksPassed(checklist.every((item) => item.done));
  }, [checklist]);

  useEffect(() => {
    if (!ready) {
      checkConnection();
    }
  }, [localServerUp, ready]);

  useEffect(() => {
    // Only set to false if not already false, don't affect the value when checks pass
    if (!allChecksPassed && ready) {
      setReady(false);
    }
  }, [allChecksPassed, setReady, ready]);

  const handleDone = () => {
    // Save configuration persistently
    localStorage.setItem('switchboardConfig', JSON.stringify({
      ready: true,
      selectedPhoneNumber,
      publicUrl,
      lastSaved: new Date().toISOString()
    }));
    setReady(true);
  };

  return (
    <Dialog open={!ready}>
      <DialogContent className="w-full max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Setup Checklist</DialogTitle>
          <DialogDescription>
            This sample app requires a few steps before you get started
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-0">
          {checklist.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 py-2"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  {item.done ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <Circle className="text-gray-400" />
                  )}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 ml-8">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex items-center mt-2 sm:mt-0">{item.field}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={handleDone}
            disabled={!allChecksPassed}
          >
            Let's go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import CallInterface from "@/components/call-interface";
import NavBar from "./components/NavBar";

export default function Page() {
  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex-1">
        <CallInterface />
      </div>
    </div>
  );
}

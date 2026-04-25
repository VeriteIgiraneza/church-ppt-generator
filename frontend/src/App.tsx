import { useEffect, useState } from "react";
import { checkHealth } from "./shared/api/client";
import "./App.css";

type BackendStatus = "checking" | "healthy" | "error";

function App() {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    checkHealth()
      .then((data) => {
        if (data.status === "healthy") {
          setStatus("healthy");
        } else {
          setStatus("error");
          setErrorMessage(`Unexpected status: ${data.status}`);
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.message);
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "system-ui, sans-serif" }}>
      <h1>Church PowerPoint Generator</h1>
      <p>Frontend: ✅ running</p>
      <p>
        Backend:{" "}
        {status === "checking" && "⏳ checking..."}
        {status === "healthy" && "✅ connected"}
        {status === "error" && `❌ ${errorMessage}`}
      </p>
    </div>
  );
}

export default App;
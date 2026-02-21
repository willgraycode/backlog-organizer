
import axios from "axios";
import { Button } from "@mantine/core";

axios.defaults.withCredentials = true;

export function Welcome() {

  const handleAuth = () => {
    window.location.href = 'https://127.0.0.1:3000/api/v1/auth/steam';
  }

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0 ">
        <Button onClick={handleAuth}>Sign in with Steam</Button>
      </div>
    </main>
  );
}

import { Room } from "@/app/Room";
import { TextEditor } from "@/components/TextEditor";
import { StreamProvider } from "@/components/StreamProvider";

export default function Home() {
  return (
    <main>
      <StreamProvider>
        <Room>
          <TextEditor />
        </Room>
      </StreamProvider>
    </main>
  );
}

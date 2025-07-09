import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ZapIcon } from "lucide-react";
import { useRouter } from "next/router"
import { useState } from "react";
import { toast } from "sonner";

enum State {
    IDLE,
    LOADING,
    ERROR,
    SUCCESS,
}

export default function Home() {

    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [state, setState] = useState<State>(State.IDLE);

    const handleGenerate = () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt to generate a blueprint.", {
                duration: 3000,
                style: {
                    width: "auto",
                    textAlign: "center",
                },
            });
            return;
        }

        setState(State.LOADING);

        setTimeout(async () => {
            setState(State.SUCCESS);
            router.push(`/${prompt.trim().replace(/\s+/g, "-")}`);
        }, 5000);
    };

    return (
        <div className="min-h-screen bg-slate relative overflow-hidden">
            <div
                className="absolute inset-0 opacity-25"
                style={{
                    backgroundImage: `radial-gradient(circle, #374151 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                }}
            />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-4">
                            <ZapIcon className="w-12 h-12" />
                            <h1 className="text-4xl md:text-5xl font-bold text-white">Synapse</h1>
                        </div>
                        <p className="text-lg md:text-xl text-gray-300 max-w-lg mx-auto">
                            Transforming Ideas into Intelligent Blueprints
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        <div className="chip px-3 py-1 rounded-full text-sm text-muted-foreground">
                            AI-Powered
                        </div>
                        <div className="chip px-3 py-1 rounded-full text-sm text-muted-foreground">
                            Instant Results
                        </div>
                        <div className="chip px-3 py-1 rounded-full text-sm text-muted-foreground">
                            Smart Analysis
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Textarea
                            className="w-full min-h-[120px] text-base bg-primary"
                            placeholder="Describe your project, idea, or topic here..."
                            maxLength={500}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                        />

                        <Button className="w-full h-12 text-base font-semibold" variant={"secondary"} size="lg" onClick={handleGenerate} disabled={state === State.LOADING}>
                            {
                                state === State.LOADING ? "Generating Blueprint..." :
                                    "Generate Blueprint"
                            }
                        </Button>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Powered by advanced AI to help you structure and develop your ideas</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

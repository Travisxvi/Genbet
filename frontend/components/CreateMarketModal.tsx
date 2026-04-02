"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Link2, Tag, DollarSign, Calendar, Sparkles } from "lucide-react";
import { useCreateMarket } from "@/lib/hooks/useGenBet";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const CATEGORIES = ["Crypto", "Sports", "Politics", "Tech", "Other"] as const;

const PRESET_TEMPLATES = [
  {
    label: "🪙 BTC > $100k",
    title: "Will BTC be above $100k by end of month?",
    description: "Bitcoin (BTC) price is currently above $100,000 USD",
    evidenceUrl: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    category: "Crypto",
  },
  {
    label: "☀️ Sunny Tomorrow",
    title: "Will it be sunny in London tomorrow?",
    description: "The weather in London is sunny (no rain, clear skies)",
    evidenceUrl: "https://wttr.in/London?format=j1",
    category: "Other",
  },
  {
    label: "🤖 GPT-5 Released",
    title: "Will OpenAI release GPT-5 this month?",
    description: "OpenAI has officially released GPT-5 to the public",
    evidenceUrl: "https://openai.com/news/",
    category: "Tech",
  },
];

export function CreateMarketModal() {
  const { isConnected, address, isLoading } = useWallet();
  const { createMarket, isCreating, isSuccess } = useCreateMarket();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [category, setCategory] = useState<string>("Crypto");
  const [creatorFeePct, setCreatorFeePct] = useState(0);
  const [deadlineTs, setDeadlineTs] = useState(0); // 0 = no deadline

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    evidenceUrl: "",
  });

  useEffect(() => {
    if (!isConnected && isOpen && !isCreating) {
      setIsOpen(false);
    }
  }, [isConnected, isOpen, isCreating]);

  useEffect(() => {
    if (isSuccess) {
      resetForm();
      setIsOpen(false);
    }
  }, [isSuccess]);

  const validateForm = (): boolean => {
    const newErrors = { title: "", description: "", evidenceUrl: "" };
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!evidenceUrl.trim()) newErrors.evidenceUrl = "Evidence URL is required";
    else {
      try {
        new URL(evidenceUrl);
      } catch {
        newErrors.evidenceUrl = "Must be a valid URL";
      }
    }
    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }
    if (!validateForm()) return;

    createMarket({
      title: title.trim(),
      description: description.trim(),
      evidenceUrl: evidenceUrl.trim(),
      category,
      creatorFeePct: Math.max(0, Math.min(10, creatorFeePct)),
      deadlineTs,
    });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEvidenceUrl("");
    setCategory("Crypto");
    setCreatorFeePct(0);
    setDeadlineTs(0);
    setErrors({ title: "", description: "", evidenceUrl: "" });
  };

  const applyTemplate = (tpl: (typeof PRESET_TEMPLATES)[number]) => {
    setTitle(tpl.title);
    setDescription(tpl.description);
    setEvidenceUrl(tpl.evidenceUrl);
    setCategory(tpl.category);
    setErrors({ title: "", description: "", evidenceUrl: "" });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) resetForm();
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" disabled={!isConnected || !address || isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Create Market
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Create Prediction Market
          </DialogTitle>
          <DialogDescription>
            Create an AI-powered market on any real-world outcome
          </DialogDescription>
        </DialogHeader>

        {/* Quick templates */}
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
            Quick templates
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/10 transition-all text-muted-foreground hover:text-[#00D4FF] cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Market Question
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Will BTC be above $80k today?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: "" });
              }}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Resolution Description
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="Bitcoin (BTC) price is currently above $80,000 USD"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors({ ...errors, description: "" });
              }}
              className={errors.description ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              AI will check the evidence URL and determine if this statement is TRUE (YES) or FALSE (NO).
            </p>
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Evidence URL */}
          <div className="space-y-2">
            <Label htmlFor="evidenceUrl" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Evidence URL
            </Label>
            <Input
              id="evidenceUrl"
              type="url"
              placeholder="https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
              value={evidenceUrl}
              onChange={(e) => {
                setEvidenceUrl(e.target.value);
                setErrors({ ...errors, evidenceUrl: "" });
              }}
              className={errors.evidenceUrl ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Public URL fetched by GenLayer AI validators at settlement time.
            </p>
            {errors.evidenceUrl && (
              <p className="text-xs text-destructive">{errors.evidenceUrl}</p>
            )}
          </div>

          {/* Category + Fee row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Category
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      category === cat
                        ? "border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.1)]"
                        : "border-white/10 hover:border-white/20 text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Creator Fee (0–10%)
              </Label>
              <Input
                id="fee"
                type="number"
                min={0}
                max={10}
                value={creatorFeePct}
                onChange={(e) => setCreatorFeePct(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Deadline (optional) */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Deadline (optional)
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              onChange={(e) => {
                if (e.target.value) {
                  setDeadlineTs(Math.floor(new Date(e.target.value).getTime() / 1000));
                } else {
                  setDeadlineTs(0);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for no deadline. When set, settlement is only possible after this time.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Market"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from "react";
import { X, MessageSquare, Save } from "lucide-react";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  itemName: string;
  currentNote?: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemName,
  currentNote = "",
}) => {
  const [note, setNote] = useState(currentNote);

  useEffect(() => {
    setNote(currentNote);
  }, [currentNote, isOpen]);

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add Note</h3>
              <p className="text-sm text-slate-400">{itemName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 resize-none text-sm sm:text-base"
              placeholder="e.g., Great quality, good price, fresh produce..."
              rows={4}
              maxLength={200}
              autoFocus
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-slate-500">
                Add your shopping observations (quality, price, etc.)
              </p>
              <span className="text-xs text-slate-500">{note.length}/200</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Great quality",
                "Good price",
                "Fresh",
                "Expensive",
                "Out of stock",
                "Perfect ripeness",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setNote(suggestion)}
                  className="px-3 py-1 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-xs text-slate-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 text-sm sm:text-base font-medium hover:bg-slate-600/50 transition-colors"
          >
            Skip Note
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm sm:text-base font-medium hover:from-emerald-600 hover:to-teal-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Complete</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          Tip: Press Ctrl + Enter to save quickly
        </p>
      </div>
    </div>
  );
};

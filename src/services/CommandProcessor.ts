import type { MarketRun } from "../lib/firestore";

// Command types
export interface VoiceCommand {
  intent:
    | "create_run"
    | "add_item"
    | "complete_item"
    | "remove_item"
    | "add_note"
    | "set_price"
    | "set_budget"
    | "complete_run"
    | "list_items"
    | "budget_status"
    | "unknown";
  entity?: string; // item name, run title, etc.
  amount?: number; // price, quantity, budget
  note?: string; // additional notes
  context?: string; // raw command for context
  confidence: number; // 0-1 confidence score
}

export interface CommandResponse {
  success: boolean;
  message: string;
  action?: string;
  data?: any;
}

export interface CommandContext {
  currentRun: MarketRun | null;
  currentPage: "home" | "analytics" | "profile";
  recentCommands: VoiceCommand[];
  currency: string;
}

export class CommandProcessor {
  private commandPatterns: Map<string, RegExp[]> = new Map();
  // private stopWords = new Set([
  //   "the",
  //   "a",
  //   "an",
  //   "and",
  //   "or",
  //   "but",
  //   "in",
  //   "on",
  //   "at",
  //   "to",
  //   "for",
  //   "of",
  //   "with",
  //   "by",
  //   "from",
  //   "up",
  //   "about",
  //   "into",
  //   "through",
  //   "during",
  //   "before",
  //   "after",
  //   "above",
  //   "below",
  //   "between",
  //   "among",
  //   "within",
  //   "without",
  //   "against",
  //   "toward",
  //   "upon",
  //   "except",
  //   "across",
  //   "since",
  //   "until",
  // ]);

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    this.commandPatterns = new Map([
      // Create new run patterns - natural ways to start shopping
      [
        "create_run",
        [
          /(?:let's|let me|i'm gonna|i'm going to|i need to|time to)\s+(?:go\s+)?(?:grocery\s+)?(?:shopping|shop|to\s+the\s+(?:store|market|grocery))(?:\s+for\s+(.+?))?(?:\s+with(?:\s+a)?\s+budget\s+of\s+\$?(\d+(?:\.\d{2})?))?/i,
          /(?:start|create|make|new)\s+(?:a\s+)?(?:new\s+)?(?:shopping\s+)?(?:list|run)(?:\s+(?:called|named|for)\s+(.+?))?(?:\s+with(?:\s+a)?\s+budget\s+of\s+\$?(\d+(?:\.\d{2})?))?/i,
          /(?:i'm\s+)?(?:going|heading)\s+(?:to\s+the\s+)?(?:store|market|grocery|supermarket)(?:\s+for\s+(.+?))?(?:\s+with(?:\s+a)?\s+budget\s+of\s+\$?(\d+(?:\.\d{2})?))?/i,
          /(?:shopping\s+)?(?:time|trip)(?:\s+for\s+(.+?))?(?:\s+with(?:\s+a)?\s+budget\s+of\s+\$?(\d+(?:\.\d{2})?))?/i,
          /(?:i\s+)?(?:need|want)\s+to\s+(?:go\s+)?(?:shopping|shop)(?:\s+for\s+(.+?))?(?:\s+with(?:\s+a)?\s+budget\s+of\s+\$?(\d+(?:\.\d{2})?))?/i,
          /(?:create|start|make)\s+(?:a\s+)?(?:new\s+)?(?:shopping\s+)?(?:list|run)\s+(?:with(?:\s+a)?\s+budget\s+of\s+\$?(\d+(?:\.\d{2})?))(?:\s+(?:called|named|for)\s+(.+?))?/i,
        ],
      ],

      // Add item patterns - natural ways people express needs
      [
        "add_item",
        [
          // Direct needs/wants
          /(?:i\s+)?(?:need|want|gotta\s+get|have\s+to\s+get|should\s+get)\s+(?:some\s+)?(.+)/i,
          /(?:can\s+(?:you\s+)?(?:add|put))\s+(.+?)(?:\s+(?:to\s+(?:the\s+)?(?:list|cart)))?/i,
          /(?:add|put|include)\s+(.+?)(?:\s+(?:to\s+(?:the\s+)?(?:list|cart)))?$/i,

          // Casual mentions
          /(?:i'm\s+out\s+of|we're\s+out\s+of|running\s+low\s+on|almost\s+out\s+of)\s+(.+)/i,
          /(?:we\s+)?(?:need|want)\s+(?:to\s+(?:get|buy|pick\s+up))\s+(?:some\s+)?(.+)/i,
          /(?:let's\s+(?:get|grab|pick\s+up))\s+(?:some\s+)?(.+)/i,
          /(?:don't\s+forget|remember\s+to\s+get)\s+(?:the\s+)?(.+)/i,

          // Shopping context
          /(?:while\s+(?:i'm|we're)\s+there|while\s+(?:i'm|we're)\s+(?:at\s+)?(?:it|shopping)),?\s+(?:get|grab|pick\s+up)\s+(?:some\s+)?(.+)/i,
          /(?:oh,?\s+)?(?:and\s+)?(?:also\s+)?(?:get|grab|buy|pick\s+up)\s+(?:some\s+)?(.+)/i,
          /(.+)\s+(?:please|too|as\s+well|also)/i,
        ],
      ],

      // Complete item patterns - natural ways to say you got something
      [
        "complete_item",
        [
          // Got/found/picked up
          /(?:i\s+)?(?:got|found|picked\s+up|grabbed|bought)\s+(?:the\s+)?(.+)/i,
          /(?:found|got)\s+(?:some\s+)?(.+)/i,
          /(.+)\s+(?:is\s+)?(?:done|complete|finished|checked\s+off|in\s+the\s+cart)/i,

          // Checking off
          /(?:check\s+off|mark\s+off|cross\s+off)\s+(?:the\s+)?(.+)/i,
          /(?:that's|that\s+is)\s+(.+)\s+(?:done|finished|complete)/i,

          // Casual confirmations
          /(?:yep|yes|yeah),?\s+(?:got|found)\s+(?:the\s+)?(.+)/i,
          /(.+)\s+(?:✓|check|done|✔)/i,
          /(?:already\s+(?:got|have))\s+(?:the\s+)?(.+)/i,
        ],
      ],

      // Remove item patterns - natural ways to say you don't need something
      [
        "remove_item",
        [
          /(?:don't|do\s+not)\s+(?:need|want)\s+(?:the\s+)?(.+)(?:\s+anymore)?/i,
          /(?:no\s+longer\s+need|changed\s+my\s+mind\s+about)\s+(?:the\s+)?(.+)/i,
          /(?:remove|delete|take\s+off)\s+(.+?)(?:\s+from\s+(?:the\s+)?(?:list|cart))?$/i,
          /(?:actually,?\s+)?(?:don't|skip)\s+(?:the\s+)?(.+)/i,
          /(?:forget|cancel)\s+(?:the\s+)?(.+)/i,
          /(?:we\s+already\s+have|i\s+already\s+have)\s+(?:enough\s+)?(.+)/i,
        ],
      ],

      // Add note patterns - natural ways to add context
      [
        "add_note",
        [
          /(?:note\s+for|remember\s+for)\s+(.+?)(?:\s*:\s*(.+))?$/i,
          /(.+)\s+(?:-|—)\s+(.+)/i,
          /(?:make\s+sure|remember)\s+(?:the\s+)?(.+?)\s+(?:is|has|needs to be)\s+(.+)/i,
          /(?:for\s+the\s+)?(.+),?\s+(?:make\s+sure|remember|note)\s+(.+)/i,
        ],
      ],

      // Set price patterns - natural price mentions
      [
        "set_price",
        [
          /(?:the\s+)?(.+)\s+(?:costs?|is|was|priced\s+at)\s+(?:about\s+)?(?:around\s+)?\$?(\d+(?:\.\d{2})?)/i,
          /(?:around\s+|about\s+)?\$?(\d+(?:\.\d{2})?)\s+(?:for|each\s+for)?\s+(?:the\s+)?(.+)/i,
          /(?:expect|budget)\s+(?:around\s+|about\s+)?\$?(\d+(?:\.\d{2})?)\s+for\s+(?:the\s+)?(.+)/i,
          /(.+)\s+(?:should\s+be|usually\s+costs?)\s+(?:around\s+|about\s+)?\$?(\d+(?:\.\d{2})?)/i,
        ],
      ],

      // Set budget patterns - natural budget mentions
      [
        "set_budget",
        [
          /(?:i\s+(?:have|got|can\s+spend)|my\s+budget\s+is|budget\s+of)\s+(?:about\s+|around\s+)?\$?(\d+(?:\.\d{2})?)/i,
          /(?:trying\s+to\s+(?:spend|keep\s+it)\s+(?:under|below))\s+\$?(\d+(?:\.\d{2})?)/i,
          /(?:don't\s+want\s+to\s+spend\s+more\s+than)\s+\$?(\d+(?:\.\d{2})?)/i,
          /(?:limit\s+(?:is|of)|max\s+(?:is|of))\s+\$?(\d+(?:\.\d{2})?)/i,
          /(?:planning\s+to\s+spend)\s+(?:about\s+|around\s+)?\$?(\d+(?:\.\d{2})?)/i,
        ],
      ],

      // Complete run patterns - natural ways to finish shopping
      [
        "complete_run",
        [
          /(?:i'm\s+)?(?:done|finished)(?:\s+shopping|\s+with\s+(?:shopping|the\s+(?:shopping|list|trip)))?/i,
          /(?:that's\s+)?(?:everything|all)(?:\s+(?:i\s+need|on\s+(?:the\s+)?list|for\s+today))?/i,
          /(?:ready\s+to\s+)?(?:checkout|check\s+out|head\s+(?:to\s+)?(?:checkout|the\s+register))/i,
          /(?:shopping\s+)?(?:trip|run)\s+(?:is\s+)?(?:complete|done|finished)/i,
          /(?:time\s+to\s+)?(?:pay|check\s+out|go\s+to\s+checkout)/i,
          /(?:got\s+everything|all\s+done|all\s+set)/i,
        ],
      ],

      // List items patterns - natural ways to ask what's needed
      [
        "list_items",
        [
          /(?:what\s+)?(?:do\s+(?:i|we)\s+(?:still\s+)?(?:need|have\s+to\s+get|gotta\s+get))/i,
          /(?:what's|what\s+is)\s+(?:still\s+)?(?:on\s+(?:the\s+)?(?:list|agenda)|left\s+(?:to\s+(?:get|buy))?)/i,
          /(?:show|tell)\s+(?:me\s+)?(?:the\s+)?(?:list|what\s+(?:i|we)\s+need)/i,
          /(?:what\s+else|anything\s+else)(?:\s+(?:do\s+(?:i|we)\s+need|on\s+the\s+list))?/i,
          /(?:list|what)\s+(?:do\s+(?:i|we)\s+have\s+)?(?:left|remaining)/i,
        ],
      ],

      // Budget status patterns - natural ways to check spending
      [
        "budget_status",
        [
          /(?:how\s+(?:much\s+)?(?:money\s+)?(?:do\s+(?:i|we)\s+have\s+left|is\s+left))/i,
          /(?:what's|what\s+is)\s+(?:my|our|the)\s+(?:budget|spending)\s+(?:like|status|looking\s+like)?/i,
          /(?:how\s+(?:am\s+i|are\s+we)\s+doing)\s+(?:on\s+(?:budget|money|spending))?/i,
          /(?:am\s+i|are\s+we)\s+(?:still\s+)?(?:on\s+budget|within\s+budget|under\s+budget)/i,
          /(?:how\s+much\s+(?:have\s+(?:i|we)\s+spent|money\s+spent))/i,
        ],
      ],
    ]);
  }

  public parseCommand(input: string, context: CommandContext): VoiceCommand {
    const cleanInput = this.preprocessInput(input);

    for (const [intent, patterns] of this.commandPatterns) {
      for (const pattern of patterns) {
        const match = cleanInput.match(pattern);
        if (match) {
          return this.extractCommandDetails(
            intent as VoiceCommand["intent"],
            match,
            cleanInput,
            context
          );
        }
      }
    }

    // If no pattern matches, return unknown command
    return {
      intent: "unknown",
      context: cleanInput,
      confidence: 0,
    };
  }

  private preprocessInput(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^\w\s$.,]/g, "") // Remove special chars except currency
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  private extractCommandDetails(
    intent: VoiceCommand["intent"],
    match: RegExpMatchArray,
    input: string,
    context: CommandContext
  ): VoiceCommand {
    const command: VoiceCommand = {
      intent,
      context: input,
      confidence: 0.8, // Base confidence
    };

    switch (intent) {
      case "create_run":
        // Handle different pattern matches for create_run
        if (intent === "create_run") {
          // Check if we have a run name in the first capture group
          if (match[1] && match[1].trim()) {
            command.entity = match[1].trim();
          }
          // Check if we have a budget in the second capture group
          if (match[2] && !isNaN(parseFloat(match[2]))) {
            command.amount = parseFloat(match[2]);
          }
          // Special case for pattern with budget first, name second
          else if (
            match[1] &&
            !isNaN(parseFloat(match[1])) &&
            match[2] &&
            match[2].trim()
          ) {
            command.amount = parseFloat(match[1]);
            command.entity = match[2].trim();
          }

          // If no name was provided, use default
          if (!command.entity) {
            command.entity = `Market Run - ${new Date().toLocaleDateString()}`;
          }
        }
        break;

      case "add_item":
        command.entity = this.cleanItemName(match[1] || "");
        command.amount = this.extractQuantityFromText(match[1] || "");
        break;

      case "complete_item":
      case "remove_item":
        command.entity = this.cleanItemName(match[1] || "");
        command.entity = this.resolveItemName(command.entity, context);
        break;

      case "add_note":
        command.entity = this.cleanItemName(match[1] || "");
        command.note = match[2]?.trim();
        command.entity = this.resolveItemName(command.entity, context);
        break;

      case "set_price":
        if (match[2] && match[1]) {
          // Pattern: "item costs X"
          command.entity = this.cleanItemName(match[1]);
          command.amount = parseFloat(match[2]);
        } else if (match[1] && match[2]) {
          // Pattern: "X dollars for item"
          command.entity = this.cleanItemName(match[2]);
          command.amount = parseFloat(match[1]);
        }
        command.entity = this.resolveItemName(command.entity!, context);
        break;

      case "set_budget":
        command.amount = parseFloat(match[1] || "0");
        break;

      default:
        // For commands without specific extraction
        break;
    }

    // Adjust confidence based on context
    command.confidence = this.calculateConfidence(command, context);

    return command;
  }

  private cleanItemName(rawName: string): string {
    if (!rawName) return "";

    return rawName
      .replace(/\b(?:some|a|an|the)\b/gi, "")
      .replace(/\b(?:pounds?|lbs?|ounces?|oz|gallons?|gal)\b/gi, "")
      .replace(/\d+/g, "") // Remove standalone numbers
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractQuantityFromText(text: string): number | undefined {
    const quantityMatch = text.match(
      /(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?|gallons?|gal|ounces?|oz)?/i
    );
    return quantityMatch && quantityMatch[1]
      ? parseFloat(quantityMatch[1])
      : undefined;
  }

  private resolveItemName(itemName: string, context: CommandContext): string {
    if (!context.currentRun?.items || !itemName) return itemName;

    // Find the best match from current list
    const items = context.currentRun.items;
    const normalizedInput = itemName.toLowerCase();

    // Exact match
    const exactMatch = items.find(
      (item) => item.name.toLowerCase() === normalizedInput
    );
    if (exactMatch) return exactMatch.name;

    // Partial match
    const partialMatch = items.find(
      (item) =>
        item.name.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(item.name.toLowerCase())
    );
    if (partialMatch) return partialMatch.name;

    // Return original if no match
    return itemName;
  }

  private calculateConfidence(
    command: VoiceCommand,
    context: CommandContext
  ): number {
    let confidence = command.confidence;

    // Boost confidence for specific patterns
    if (command.entity && context.currentRun?.items) {
      const hasMatchingItem = context.currentRun.items.some((item) =>
        item.name.toLowerCase().includes(command.entity!.toLowerCase())
      );
      if (hasMatchingItem) confidence += 0.15;
    }

    // Lower confidence for very short entities
    if (command.entity && command.entity.length < 3) {
      confidence -= 0.2;
    }

    // Boost confidence for commands with amounts
    if (command.amount && command.amount > 0) {
      confidence += 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  public generateResponse(
    command: VoiceCommand,
    result: CommandResponse,
    context: CommandContext
  ): string {
    if (!result.success) {
      return this.generateErrorResponse(command, result.message);
    }

    const currency = context.currency || "$";

    switch (command.intent) {
      case "create_run":
        return `Created "${command.entity}". ${
          command.amount ? `Budget set to ${currency}${command.amount}. ` : ""
        }Ready to add items!`;

      case "add_item":
        const quantityText = command.amount
          ? ` (${command.amount} ${this.getQuantityUnit(command.context!)})`
          : "";
        return `Added ${command.entity}${quantityText} to your shopping list. What else do you need?`;

      case "complete_item":
        return `Great! Marked ${command.entity} as complete. Keep up the good work!`;

      case "remove_item":
        return `Removed ${command.entity} from your list.`;

      case "add_note":
        return `Added note "${command.note}" to ${command.entity}.`;

      case "set_price":
        return `Updated ${
          command.entity
        } price to ${currency}${command.amount?.toFixed(2)}.`;

      case "set_budget":
        return `Budget set to ${currency}${command.amount}. Start adding items to your list!`;

      case "complete_run":
        return `Shopping run completed! ${result.message}`;

      case "list_items":
        return result.message;

      case "budget_status":
        return result.message;

      default:
        return result.message || "Command completed successfully.";
    }
  }

  private generateErrorResponse(command: VoiceCommand, error: string): string {
    switch (command.intent) {
      case "add_item":
        return `I couldn't add "${command.entity}" to your list. ${error}`;

      case "complete_item":
        return `I couldn't find "${command.entity}" in your list. Could you try a different name?`;

      case "unknown":
        return `I didn't understand that command. Try saying something like "add milk to my list" or "create new shopping run".`;

      default:
        return `Sorry, I couldn't complete that action. ${error}`;
    }
  }

  private getQuantityUnit(context: string): string {
    if (context.includes("pound") || context.includes("lb")) return "lbs";
    if (context.includes("gallon") || context.includes("gal")) return "gallons";
    if (context.includes("ounce") || context.includes("oz")) return "oz";
    return "units";
  }

  // Utility method for smart suggestions
  public getSuggestions(
    partialCommand: string,
    context: CommandContext
  ): string[] {
    const suggestions: string[] = [];

    if (partialCommand.toLowerCase().includes("add")) {
      suggestions.push(
        "add milk to my list",
        "add bread",
        "add 2 pounds of rice"
      );
    }

    if (partialCommand.toLowerCase().includes("complete")) {
      if (context.currentRun?.items) {
        const incompleteItems = context.currentRun.items
          .filter((item) => !item.completed)
          .slice(0, 3);
        suggestions.push(
          ...incompleteItems.map((item) => `complete ${item.name}`)
        );
      }
    }

    return suggestions;
  }
}

// Singleton instance
let commandProcessorInstance: CommandProcessor | null = null;

export const getCommandProcessor = (): CommandProcessor => {
  if (!commandProcessorInstance) {
    commandProcessorInstance = new CommandProcessor();
  }
  return commandProcessorInstance;
};

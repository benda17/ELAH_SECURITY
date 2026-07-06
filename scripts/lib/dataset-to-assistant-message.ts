/**
 * Maps dataset audit-log action types to natural-language prompts for the
 * in-app AI assistant. Phrase variants live in scripts/data/assistant-phrase-bank.json.
 */

export {
  type DatasetActionSample,
  DIRECT_AUDIT_ACTIONS,
  datasetActionToAssistantMessage,
  getAssistantPhraseBank,
  isAssistantSeedAction,
  pickConfirmPhrase,
} from "./assistant-phrase-bank";

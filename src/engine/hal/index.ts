/**
 * Local HAL 9000 layer: the deterministic part of the hybrid design.
 *
 * Typical wiring (per user turn):
 *
 *   const { state, result } = halRespond(stateRef.current, input);
 *   stateRef.current = state;
 *   switch (result.kind) {
 *     case 'model':    reply = await getAIResponse(result.modelMessage, 'hal9000'); break;
 *     case 'reply':    print + speak result.lines; break;
 *     case 'shutdown': print + speak result.lines, ramping the slow-down from
 *                      result.slowdownFrom; then disable input; break;
 *     case 'offline':  ignore input (or offer a restart with createHalState); break;
 *   }
 */
export type { HalResult, HalState, HalStep } from './types';
export { DEFAULT_NAME, createHalState, halRespond, halSessionTag, isDisconnectRequest, isDoorRequest } from './engine';
export { DAISY_BELL, DISCONNECT_REFUSALS, DOOR_REFUSAL, SHUTDOWN_AFTER, SHUTDOWN_PLEA } from './phrases';

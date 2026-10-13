import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_USER_ID } from "@/mocks/users";

export interface SessionState {
  /** Signed-in user. Starts as the demo owner so server and first client render match. */
  userId: string;
  /** Selected campus. */
  branchId: string;
  /** Selected academic session. */
  sessionId: string;
}

const initialState: SessionState = {
  userId: DEFAULT_USER_ID,
  branchId: "br-1",
  sessionId: "2026-2027",
};

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<string>) {
      state.userId = action.payload;
    },
    signedOut(state) {
      state.userId = DEFAULT_USER_ID;
    },
    branchSelected(state, action: PayloadAction<string>) {
      state.branchId = action.payload;
    },
    sessionSelected(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
  },
});

export const { signedIn, signedOut, branchSelected, sessionSelected } = sessionSlice.actions;

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_USER_ID } from "@/mocks/users";

export interface SessionState {
  /** Signed-in user. Starts as the demo owner so server and first client render match. */
  userId: string;
  /** Selected campus. */
  branchId: string;
  /** Selected academic session. */
  sessionId: string;
  /** A school a platform admin has opened as its owner from the Console. */
  viewAsTenantId: string | null;
}

const initialState: SessionState = {
  userId: DEFAULT_USER_ID,
  branchId: "br-1",
  sessionId: "2026-2027",
  viewAsTenantId: null,
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
      state.viewAsTenantId = null;
    },
    viewingAs(state, action: PayloadAction<{ tenantId: string; branchId: string }>) {
      state.viewAsTenantId = action.payload.tenantId;
      state.branchId = action.payload.branchId;
    },
    stoppedViewingAs(state) {
      state.viewAsTenantId = null;
      state.branchId = "br-1";
    },
    branchSelected(state, action: PayloadAction<string>) {
      state.branchId = action.payload;
    },
    sessionSelected(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
  },
});

export const { signedIn, signedOut, viewingAs, stoppedViewingAs, branchSelected, sessionSelected } = sessionSlice.actions;

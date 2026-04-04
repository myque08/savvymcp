export enum GameEvaluation {
  Good = "Very Good",
  New = "Good",
  Neutral = "Neutral",
  Bad = "Bad",
}

export interface GameInfo {
  id: number;
  game_name: string;
  price_raw: number;
  game_number_raw: number;
  image_url: string;
  total_tickets_raw: number;
  odds_raw: number;
  evaluation: GameEvaluation;
  total_prizes_claimed: number;
  estimated_tickets_sold: number;
  remaining_tickets: number;
  weighted_score: number;
  prizes_data: Prize[];
}

export interface Prize {
  amount: number;
  amountDisplay?: string;
  newOdds: number;
  initialOdds: number;
  prizesInGame: number;
  prizesClaimed: number;
  prizesRemaining: number;
}

export interface State {
  code: string;
  display_name: string;
}

export interface SubscriptionDetails {
  subscriptionId: string;
  store: "stripe" | "google-play" | "apple-store";
  subType: "day" | "week" | "month" | "year" | "Unknown";
  periodType: "NORMAL" | "PAUSED" | "TRIAL" | "INTRO";
  subscribedTillDate: number;
  endsOn: boolean;
  daysUntilDue: number | null;
  referredBy: string | null;
}

export interface McpSession {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  isSubscribed: boolean;
  subscriptionDetails?: SubscriptionDetails | null;
}

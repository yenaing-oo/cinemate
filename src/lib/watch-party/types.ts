// Shared watch party types for API results and UI components.
export type WatchPartyStatusValue = "OPEN" | "CLOSED" | "CONFIRMED";

export type WatchPartyViewerRole = "LEADER" | "PARTICIPANT";

// Basic person data used in watch party screens.
export type WatchPartyPerson = {
    id: string;
    email: string;
    name: string | null;
};

// Participant rows only represent joined members, not the leader.
export type WatchPartyMember = WatchPartyPerson & {
    role: "PARTICIPANT";
};

// Small showtime shape used in lists and detail pages.
export type WatchPartyShowtimeSummary = {
    id: string;
    startTime: Date;
    price: number;
    movie: {
        title: string;
    };
};

// Data needed for a dashboard card.
export type WatchPartyListItem = {
    id: string;
    name: string;
    inviteCode: string;
    status: WatchPartyStatusValue;
    leader: WatchPartyPerson;
    showtime: WatchPartyShowtimeSummary;
    _count: {
        participants: number;
    };
};

// Full detail view data for one watch party.
export type WatchPartyDetail = WatchPartyListItem & {
    memberCount: number;
    participants: WatchPartyMember[];
    viewerRole: WatchPartyViewerRole;
};

// Dashboard groups parties by the user's role in them.
export type WatchPartyDashboardData = {
    createdParties: WatchPartyListItem[];
    joinedParties: WatchPartyListItem[];
};

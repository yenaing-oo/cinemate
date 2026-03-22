export type WatchPartyStatusValue = "ACTIVE" | "IN_PROGRESS" | "CONFIRMED";

export type WatchPartyViewerRole = "LEADER" | "PARTICIPANT";

export type WatchPartyPerson = {
    id: string;
    email: string;
    name: string | null;
};

export type WatchPartyMember = WatchPartyPerson & {
    role: "PARTICIPANT";
};

export type WatchPartyShowtimeSummary = {
    id: string;
    startTime: Date;
    price: number;
    movie: {
        title: string;
    };
};

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

export type WatchPartyDetail = WatchPartyListItem & {
    memberCount: number;
    participants: WatchPartyMember[];
    viewerRole: WatchPartyViewerRole;
};

export type WatchPartyDashboardData = {
    createdParties: WatchPartyListItem[];
    joinedParties: WatchPartyListItem[];
};

export type WatchPartyListItem = {
    id: string;
    name: string;
    inviteCode: string;
    status: string;
    leader: {
        name: string | null;
        email: string;
    };
    showtime: {
        startTime: Date;
        movie: {
            title: string;
        };
    };
    _count: {
        participants: number;
    };
};

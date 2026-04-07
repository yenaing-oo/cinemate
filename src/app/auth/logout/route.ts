import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function POST() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        return NextResponse.json(
            { error: error.message || "Unable to clear your session." },
            { status: 500 }
        );
    }

    return new NextResponse(null, { status: 204 });
}

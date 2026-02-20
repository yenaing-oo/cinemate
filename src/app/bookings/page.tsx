import { api, HydrateClient } from "~/trpc/server";
import { BookingDropDownRow } from "~/app/bookings/BookingDropDownRow";

export default async function OrderHistoryPage() {
  const bookings = await api.bookings.list();
  const now = new Date();

  const currentBookings = bookings
    .filter((b) => new Date(b.showtime.startTime) >= now)
    .sort(
      (a, b) =>
        new Date(a.showtime.startTime).getTime() -
        new Date(b.showtime.startTime).getTime()
    );

  return (
    <HydrateClient>
      <section className="mx-auto w-full max-w-7xl space-y-14 px-6 pt-6 pb-16">
        <div>
          <h3 className="mb-6 text-2xl font-bold">Your Bookings</h3>

          {currentBookings.length === 0 ? (
            <p className="text-muted-foreground">
              You don’t have any upcoming bookings.
            </p>
          ) : (
            <div className="space-y-4">
              {currentBookings.map((b) => {
                const seats = b.tickets
                  .map((t) => `${t.seat.row}${t.seat.number}`)
                  .sort();

                return (
                  <BookingDropDownRow
                    key={b.id}
                    posterUrl={b.showtime.movie.posterUrl ?? undefined}
                    movieTitle={b.showtime.movie.title}
                    showtime={b.showtime.startTime}
                    seats={seats}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </HydrateClient>
  );
}
# Cinemate - COMP 4350 Project Proposal

## Project Team

**Team MatrixPlus**
- [Dhairya Kachhia](https://github.com/DhairyaKachhia)
- [Hrutil Patel](https://github.com/HrutilPatel)
- [Kelvin Oo](https://github.com/yenaing-oo)
- [Krish Patel](https://github.com/krrish267)
- [Tanha Patel](https://github.com/Tanpatel)

## Project Summary and Vision

Cinemate is a full-stack web application built to modernize the cinema ticket-booking experience, with a focus on making group movie plans simple, clear, and enjoyable. Coordinating a movie outing with friends is often frustrating: managing showtimes, seat availability, and payments separately leads to confusion. And when one person books for everyone, they’re burdened with collecting payments afterwards.

Cinemate solves this by combining a standard ticketing flow with a Watch Party feature that allows one person to book for the group while everyone pays individually. This removes the need for collecting payments afterwards and prevents last-minute confusion, making group movie planning as seamless as booking a ticket alone. 

Our goal is to offer movie-goers the flexibility to plan group outings without the usual hassle—allowing one person to organize the tickets while everyone pays individually. Cinemate makes it simple: watch together, pay apart.

## Core Functional Features

- Movie & Showtime Selection
- Booking
- Order History & Cancellation
- Watch Party
- Email Confirmation

## Technologies

- Next.js (frontend framework)
- TypeScript (application language)
- tRPC (API and data transport)
- Tailwind CSS (styling)
- Prisma (ORM)
- PostgreSQL (database)

## User Stories

**Movie & Showtime Selection**
- As a user, I want to browse available movies so that I can choose which one to watch.
- As a user, I want to see detailed information about each movie so that I can make an informed decision.
- As a user, I want to see available showtimes so that I can pick a convenient timeslot.

**Booking**
- As a user, I want to choose how many tickets to book so that I can purchase for myself or a group.
- As a user, I want the system to automatically assign the best available seats so that I can book quickly.
- As a user, I want to manually select seats from an interactive seat map so that I can choose my preferred seats.
- As a user, I want to see real-time seat availability so that I avoid selecting seats already taken.
- As a user, I want my selected seats to remain temporarily reserved while I review my booking.
- As a user, I want to review my booking details before confirming purchase.
- As a user, I want to securely enter my payment details so that I can complete my booking.
- As a user, I want to be redirected to my ticket or order summary after successful payment for immediate confirmation.

**Order History & Cancellation**
- As a user, I want to view my booked tickets and seat details so that I can access them at the cinema.
- As a user, I want to view my past bookings so that I can manage my ticket history.
- As a user, I want to cancel a booking within allowed constraints so that I can handle schedule changes.

**Watch Party**
- As a party leader, I want to create a Watch Party so that I can invite friends for a movie outing.
- As a party leader, I want to invite friends via email so that I can gather participants.
- As a participant, I want to join a Watch Party so that my party leader can book tickets on my behalf.
- As a participant, I want to view the Watch Party status so that I know who is attending and whether the booking is complete.
- As a party leader, I want to select the showtime and seats for my entire party so that the group can attend together.
- As a party leader, I want to finalize the booking after confirming payment for my ticket so that everyone is reserved.

**Email Confirmation**
- As a user, I want to receive a confirmation email after completing my booking so that I have proof of purchase and ticket details.
- As a user, I want to receive a confirmation email after cancelling my tickets so that I know the cancellation is processed.


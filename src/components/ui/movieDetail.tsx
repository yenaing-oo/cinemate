'use client';

// Simple movie detail card used on movie-related screens.
import Image from "next/image";
import { Card, CardContent } from "~/components/ui/card";

interface MovieDetailProps {
    props: {
        posterUrl: string;
        title: string;
        languages: string[];
        showTime: string;
    };
}

function MovieDetail({ props }: MovieDetailProps) {
    return (
        <div className="grid grid-cols-[auto_auto] gap-10 max-[500px]:grid-cols-1">
            <div className="relative h-80 w-45 shrink-0 justify-self-center overflow-hidden rounded-lg">
                <Card>
                    <CardContent className="p-0">
                        {props.posterUrl ? (
                            <div className="h-130 w-full">
                                <Image
                                    src={props.posterUrl}
                                    alt={`${props.title} poster`}
                                    fill
                                    sizes="(min-width: 500px) 360px, 80vw"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="bg-muted/40 text-muted-foreground flex h-[520px] items-center justify-center px-6 text-center text-sm">
                                Poster not available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div>
                <p className="text-muted-foreground/70 text-s font-semibold tracking-[0.45em] uppercase">
                    Movie Details
                </p>
                <h1 className="mt-2 mb-5 text-4xl leading-tight font-bold md:text-5xl">
                    {props.title}
                </h1>
                {props.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {props.languages.map((language) => (
                            <span
                                key={`language-${language}`}
                                className="border-border/60 bg-background rounded-full border px-3 py-1 text-xs"
                            >
                                {language}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-muted-foreground/70 text-s mt-5 font-semibold uppercase">
                    {props.showTime}
                </p>
            </div>
        </div>
    )
}

export {MovieDetail};

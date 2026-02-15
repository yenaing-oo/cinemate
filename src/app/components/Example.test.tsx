function Hello({ name }: { name: string }) {
    return <p>Hello {name}</p>;
}

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("Hello component", () => {
    it("renders the provided name", () => {
        render(<Hello name="User" />);
        expect(screen.getByText("Hello User")).toBeInTheDocument();
    });
});

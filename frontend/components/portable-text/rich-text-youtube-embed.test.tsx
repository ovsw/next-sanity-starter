import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RichTextYoutubeEmbed } from "./rich-text-youtube-embed";

describe("RichTextYoutubeEmbed", () => {
  it("uses the authored thumbnail as the player cover", async () => {
    const user = userEvent.setup();
    render(
      <RichTextYoutubeEmbed
        description="Editor-authored summary."
        thumbnail={{
          alt: "Custom thumbnail",
          height: 720,
          url: "https://cdn.sanity.io/images/project/dataset/video.jpg",
          width: 1280,
        }}
        title="Demo Video"
        videoId="abc123def45"
      />,
    );

    expect(screen.getByRole("button", { name: "Play: Demo Video" })).toBeInTheDocument();
    expect(screen.queryByTitle("Demo Video")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Play: Demo Video" }));

    expect(screen.getByTitle("Demo Video")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123def45?autoplay=1&rel=0",
    );
    expect(screen.getByText("Editor-authored summary.")).toBeInTheDocument();
  });

  it("renders the player immediately when no thumbnail is authored", () => {
    render(<RichTextYoutubeEmbed title="Plain Video" videoId="abc123def45" />);

    expect(screen.getByTitle("Plain Video")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123def45?rel=0",
    );
  });
});

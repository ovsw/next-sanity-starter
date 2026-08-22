import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { loanIcons } from "../../../shared/loan-icons";
import { NavigationIcon } from "./navigation-icon";

const landmarkSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 22h18"></path><path d="M6 18v-7"></path></svg>';

describe("NavigationIcon", () => {
  it("renders the SVG markup stored with the document", () => {
    const { container } = render(
      <NavigationIcon
        className="size-5"
        icon={{ name: "landmark", svg: landmarkSvg }}
      />,
    );

    expect(container.querySelector("svg path")).toBeInTheDocument();
    const wrapper = container.querySelector("span");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveClass("size-5");
  });

  it("omits Lucide icons that have no stored SVG markup", () => {
    const { container } = render(
      <NavigationIcon icon={{ name: "landmark", svg: null }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("omits stored values that are not SVG markup", () => {
    const { container } = render(
      <NavigationIcon
        icon={{ name: "landmark", svg: '<script>alert("nope")</script>' }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("omits SVG markup carrying event handlers", () => {
    const { container } = render(
      <NavigationIcon
        icon={{
          name: "landmark",
          svg: '<svg viewBox="0 0 24 24" onload="alert(1)"><path d="M3 22h18"></path></svg>',
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("omits SVG markup with unsafe elements", () => {
    const { container } = render(
      <NavigationIcon
        icon={{
          name: "landmark",
          svg: "<svg><script>alert(1)</script></svg>",
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it.each(loanIcons)("renders the $title custom icon", ({ value }) => {
    const { container } = render(
      <NavigationIcon className="size-5" icon={{ name: value, svg: null }} />,
    );

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("svg")).toHaveClass("size-5");
    expect(container.querySelector("path, circle")).toBeInTheDocument();
  });
});

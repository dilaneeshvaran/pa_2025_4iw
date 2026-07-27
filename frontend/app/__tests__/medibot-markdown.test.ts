import { describe, it, expect } from "vitest";
import { renderMedibotMarkdown } from "../utils/medibotMarkdown";

describe("renderMedibotMarkdown", () => {
  it("renders bold and italic emphasis", () => {
    expect(renderMedibotMarkdown("Consultez la **Médecine Générale**.")).toBe(
      "Consultez la <strong>Médecine Générale</strong>.",
    );
    expect(renderMedibotMarkdown("C'est *important*")).toBe(
      "C&#39;est <em>important</em>",
    );
  });

  it("turns bullet markers into bullets without italicising them", () => {
    expect(renderMedibotMarkdown("- ORL\n* Cardiologie")).toBe("• ORL\n• Cardiologie");
  });

  it("renders headings as a bold line", () => {
    expect(renderMedibotMarkdown("### Spécialités")).toBe("<strong>Spécialités</strong>");
  });

  it("closes emphasis left open by the typewriter effect", () => {
    expect(renderMedibotMarkdown("il est **essentiel de consul")).toBe(
      "il est <strong>essentiel de consul</strong>",
    );
    expect(renderMedibotMarkdown("**ORL** puis *card")).toBe(
      "<strong>ORL</strong> puis <em>card</em>",
    );
  });

  it("escapes HTML instead of rendering it", () => {
    expect(renderMedibotMarkdown('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    expect(renderMedibotMarkdown("**<b>gras</b>**")).toBe(
      "<strong>&lt;b&gt;gras&lt;/b&gt;</strong>",
    );
  });

  it("keeps only the label of a markdown link", () => {
    expect(renderMedibotMarkdown("[Mes rendez-vous](https://evil.example)")).toBe(
      "Mes rendez-vous",
    );
  });
});

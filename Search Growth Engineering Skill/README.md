# Search Growth Engine v1.0.0

Portable AI skill for SEO, SEM, GEO, AIO, ASO and search-growth engineering.

## Recommended usage

### Cursor
Install under `.cursor/skills/search-growth-engine/SKILL.md` or `.agents/skills/search-growth-engine/SKILL.md`. Cursor supports portable Agent Skills with `SKILL.md`, scripts, references and assets, and discovers them from project/user skill directories. citeturn677180search1

Keep `AGENTS.md` at the project root for short persistent repository-specific rules. Cursor supports both `AGENTS.md` and `.cursor/rules`. citeturn677180search0

### Claude Code
Copy the skill into the compatible skills directory used by the Claude Code setup and keep the repository-level `AGENTS.md` plus a project-specific `CLAUDE.md` when desired. Use MCP for first-party data sources and external tools.

Claude Code's CLI supports non-interactive prompts, JSON output and MCP configuration, which makes it useful for scheduled/CI audit workflows. citeturn509401search3turn509401search9

### Google AI Studio
Use AI Studio as the prompt/model test bench. Test the decision engine with structured output, function calling, code execution and grounding before changing production skill instructions. citeturn677180search3

## Google-policy guardrails

This skill deliberately avoids guarantees and manipulative tactics. Google Search Essentials emphasize technical eligibility, people-first content and crawlable links; Google's AI-search guidance states that technical clarity remains foundational for generative AI features; Google's spam policies prohibit scaled content abuse and other manipulative practices. citeturn509401search0turn509401search5turn509401search4

## Next engineering layer

Add MCP/connectors for:
- Google Search Console
- Google Analytics
- Google Ads
- Bing Webmaster Tools
- Microsoft Ads
- crawl/performance tooling
- CMS/data sources

The skill should keep platform credentials and provider configuration outside prompts and schemas.

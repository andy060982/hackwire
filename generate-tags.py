#!/usr/bin/env python3
"""Generate tags for HackWire articles that have empty tags arrays.

Uses pattern matching and keyword extraction — no AI APIs.
"""

import json
import re
from pathlib import Path

ARTICLES_PATH = Path(__file__).parent / "src" / "lib" / "articles-data.json"

# Category-based seed tags
CATEGORY_TAGS = {
    "breaches": ["data-breach"],
    "vulnerabilities": ["vulnerability"],
    "malware": ["malware"],
    "ransomware": ["ransomware"],
    "policy": ["cybersecurity-policy"],
    "tools": ["security-tools"],
}

# Keyword patterns -> tag mappings (checked against headline + summary)
# Order matters: more specific patterns first
KEYWORD_TAG_MAP = [
    # Attack types
    (r"\bzero[- ]?day\b", "zero-day"),
    (r"\bransomware\b", "ransomware"),
    (r"\bphishing\b", "phishing"),
    (r"\bspear[- ]?phishing\b", "spear-phishing"),
    (r"\bddos\b", "ddos"),
    (r"\bbrute[- ]?force\b", "brute-force"),
    (r"\bsupply[- ]?chain\b", "supply-chain"),
    (r"\bman[- ]?in[- ]?the[- ]?middle\b", "mitm"),
    (r"\bcredential[- ]?stuffing\b", "credential-stuffing"),
    (r"\bsocial[- ]?engineering\b", "social-engineering"),
    (r"\bsql[- ]?injection\b", "sql-injection"),
    (r"\bxss\b", "xss"),
    (r"\bcross[- ]?site\b", "xss"),
    (r"\bremote code execution\b", "rce"),
    (r"\b(?:rce)\b", "rce"),
    (r"\bprivilege escalation\b", "privilege-escalation"),
    (r"\bbackdoor\b", "backdoor"),
    (r"\bbotnet\b", "botnet"),
    (r"\bcryptojack\b", "cryptojacking"),
    (r"\bcryptomining\b", "cryptojacking"),
    (r"\bexploit(?:ed|s|ation)?\b", "exploit"),
    (r"\binfo[- ]?stealer\b", "infostealer"),
    (r"\binfostealer\b", "infostealer"),
    (r"\bstealer\b", "infostealer"),
    (r"\bspyware\b", "spyware"),
    (r"\btrojan\b", "trojan"),
    (r"\bworm\b", "worm"),
    (r"\brootkit\b", "rootkit"),
    (r"\bkeylogger\b", "keylogger"),
    (r"\badware\b", "adware"),
    (r"\bwiper\b", "wiper"),
    (r"\brat\b", "remote-access-trojan"),
    (r"\bremote access trojan\b", "remote-access-trojan"),

    # Targets / sectors
    (r"\bhealthcare\b", "healthcare"),
    (r"\bhospital\b", "healthcare"),
    (r"\bmedical\b", "healthcare"),
    (r"\bhipaa\b", "hipaa"),
    (r"\bfinancial\b", "finance"),
    (r"\bbanking\b", "finance"),
    (r"\bbank\b", "finance"),
    (r"\bcritical infrastructure\b", "critical-infrastructure"),
    (r"\bscada\b", "ics-scada"),
    (r"\bindustrial control\b", "ics-scada"),
    (r"\bics\b", "ics-scada"),
    (r"\beducation\b", "education"),
    (r"\buniversity\b", "education"),
    (r"\bschool\b", "education"),
    (r"\bgovernment\b", "government"),
    (r"\bfederal\b", "government"),
    (r"\bnation[- ]?state\b", "nation-state"),
    (r"\bstate[- ]?sponsored\b", "nation-state"),
    (r"\bapt\b", "apt"),
    (r"\bthreat actor\b", "threat-actor"),
    (r"\bthreat group\b", "threat-actor"),

    # Technologies
    (r"\bcloud\b", "cloud-security"),
    (r"\baws\b", "aws"),
    (r"\bazure\b", "azure"),
    (r"\bgoogle cloud\b", "gcp"),
    (r"\bkubernetes\b", "kubernetes"),
    (r"\bdocker\b", "docker"),
    (r"\bcontainer\b", "containers"),
    (r"\bai\b", "ai-security"),
    (r"\bartificial intelligence\b", "ai-security"),
    (r"\bmachine learning\b", "ai-security"),
    (r"\bllm\b", "ai-security"),
    (r"\bchatgpt\b", "ai-security"),
    (r"\biot\b", "iot"),
    (r"\bfirmware\b", "firmware"),
    (r"\bvpn\b", "vpn"),
    (r"\bfirewall\b", "firewall"),
    (r"\brouter\b", "network-security"),
    (r"\bwi-?fi\b", "wifi"),
    (r"\bbluetooth\b", "bluetooth"),
    (r"\bencryption\b", "encryption"),
    (r"\bcryptograph\b", "encryption"),
    (r"\bquantum\b", "quantum"),
    (r"\bblockchain\b", "blockchain"),
    (r"\bcrypto(?:currency)?\b", "cryptocurrency"),
    (r"\bbitcoin\b", "cryptocurrency"),
    (r"\bnft\b", "cryptocurrency"),
    (r"\bapi\b", "api-security"),
    (r"\bopen[- ]?source\b", "open-source"),
    (r"\bgithub\b", "github"),

    # Platforms / vendors
    (r"\bwindows\b", "windows"),
    (r"\bmicrosoft\b", "microsoft"),
    (r"\blinux\b", "linux"),
    (r"\bandroid\b", "android"),
    (r"\bios\b", "ios"),
    (r"\bapple\b", "apple"),
    (r"\bgoogle\b", "google"),
    (r"\bchrome\b", "chrome"),
    (r"\bfirefox\b", "firefox"),
    (r"\bcisco\b", "cisco"),
    (r"\bfortinet\b", "fortinet"),
    (r"\bpalo alto\b", "palo-alto"),
    (r"\bivanti\b", "ivanti"),
    (r"\bvmware\b", "vmware"),
    (r"\bcitrix\b", "citrix"),
    (r"\boracle\b", "oracle"),
    (r"\bsap\b", "sap"),
    (r"\bwordpress\b", "wordpress"),
    (r"\bdrupal\b", "drupal"),
    (r"\bnginx\b", "nginx"),
    (r"\bapache\b", "apache"),
    (r"\bsalesforce\b", "salesforce"),
    (r"\batlassian\b", "atlassian"),
    (r"\bjira\b", "atlassian"),
    (r"\bconfluence\b", "atlassian"),
    (r"\bsplunk\b", "splunk"),
    (r"\bcrowdstrike\b", "crowdstrike"),
    (r"\bsentinelone\b", "sentinelone"),
    (r"\bmandiant\b", "mandiant"),
    (r"\bkaspersky\b", "kaspersky"),
    (r"\bsophos\b", "sophos"),
    (r"\bsamsung\b", "samsung"),
    (r"\bnvidia\b", "nvidia"),
    (r"\bintel\b", "intel"),
    (r"\bamd\b", "amd"),
    (r"\bdell\b", "dell"),
    (r"\bhp\b", "hp"),
    (r"\blenovo\b", "lenovo"),
    (r"\bjuniper\b", "juniper"),
    (r"\bnetgear\b", "netgear"),
    (r"\btp-link\b", "tp-link"),
    (r"\bzyxel\b", "zyxel"),
    (r"\bqnap\b", "qnap"),
    (r"\bsynology\b", "synology"),
    (r"\btelegram\b", "telegram"),
    (r"\bwhatsapp\b", "whatsapp"),
    (r"\bsignal\b", "signal"),
    (r"\bslack\b", "slack"),
    (r"\bzoom\b", "zoom"),
    (r"\bteams\b", "microsoft-teams"),

    # Compliance / frameworks
    (r"\bnist\b", "nist"),
    (r"\bgdpr\b", "gdpr"),
    (r"\bsoc ?2\b", "soc2"),
    (r"\bpci\b", "pci-dss"),
    (r"\bcompliance\b", "compliance"),
    (r"\bregulat\b", "regulation"),
    (r"\bexecutive order\b", "executive-order"),
    (r"\bsanction\b", "sanctions"),
    (r"\bindictment\b", "law-enforcement"),
    (r"\barrest\b", "law-enforcement"),
    (r"\bextradite\b", "law-enforcement"),
    (r"\bfbi\b", "fbi"),
    (r"\bcisa\b", "cisa"),
    (r"\bnsa\b", "nsa"),
    (r"\beuropol\b", "europol"),
    (r"\binterpol\b", "interpol"),

    # Security concepts
    (r"\bpatch(?:es|ed|ing)?\b", "patching"),
    (r"\bcve-\d{4}-\d+", "cve"),
    (r"\bdata leak\b", "data-leak"),
    (r"\bdata exfiltration\b", "data-exfiltration"),
    (r"\bdata loss\b", "data-loss"),
    (r"\bidentity\b", "identity"),
    (r"\bauthentication\b", "authentication"),
    (r"\bmfa\b", "mfa"),
    (r"\btwo[- ]?factor\b", "mfa"),
    (r"\bpassword\b", "passwords"),
    (r"\bpasskey\b", "passkeys"),
    (r"\bbiometric\b", "biometrics"),
    (r"\bpentesting\b", "pentesting"),
    (r"\bpenetration test\b", "pentesting"),
    (r"\bbug bounty\b", "bug-bounty"),
    (r"\bthreat intelligence\b", "threat-intelligence"),
    (r"\bthreat hunting\b", "threat-hunting"),
    (r"\bincident response\b", "incident-response"),
    (r"\bforensic\b", "forensics"),
    (r"\bsiem\b", "siem"),
    (r"\bsoar\b", "soar"),
    (r"\bedr\b", "edr"),
    (r"\bxdr\b", "xdr"),
    (r"\bsase\b", "sase"),
    (r"\bzero trust\b", "zero-trust"),
    (r"\bdevsecops\b", "devsecops"),
    (r"\bdeception\b", "deception"),
    (r"\bhoneypot\b", "honeypot"),
    (r"\bsandbox\b", "sandbox"),
    (r"\bwebinar\b", "webinar"),
    (r"\breport\b", "report"),
    (r"\bsurvey\b", "survey"),
    (r"\bacquisition\b", "acquisition"),
    (r"\bmerger\b", "acquisition"),
    (r"\bfunding\b", "funding"),
    (r"\bstartup\b", "startup"),
    (r"\bopen[- ]?ai\b", "openai"),

    # Countries / regions (threat context)
    (r"\bchina\b", "china"),
    (r"\bchinese\b", "china"),
    (r"\brussia\b", "russia"),
    (r"\brussian\b", "russia"),
    (r"\bnorth korea\b", "north-korea"),
    (r"\blazarus\b", "north-korea"),
    (r"\biran\b", "iran"),
    (r"\biranian\b", "iran"),
    (r"\bukraine\b", "ukraine"),
    (r"\bisrael\b", "israel"),
    (r"\beu\b", "european-union"),
    (r"\beuropean union\b", "european-union"),
]

# Compile patterns once
COMPILED_PATTERNS = [(re.compile(pat, re.IGNORECASE), tag) for pat, tag in KEYWORD_TAG_MAP]


def generate_tags(article: dict) -> list[str]:
    """Generate 3-5 tags for an article based on category and content."""
    tags = set()

    category = article.get("category", "")
    headline = article.get("headline", "")
    summary = article.get("summary", "")
    text = f"{headline} {summary}"

    # Add category-based tags
    for t in CATEGORY_TAGS.get(category, []):
        tags.add(t)

    # Match keyword patterns
    for pattern, tag in COMPILED_PATTERNS:
        if pattern.search(text):
            tags.add(tag)

    # Remove the category seed tag if we have enough from content
    cat_tags = set(CATEGORY_TAGS.get(category, []))
    content_tags = tags - cat_tags

    if len(content_tags) >= 3:
        # We have enough content tags, keep them
        result = list(content_tags)
    else:
        # Include category tags to pad
        result = list(tags)

    # Limit to 3-5 tags; prefer content-derived tags
    if len(result) > 5:
        # Prioritize: keep non-category tags first, then fill with category
        content = [t for t in result if t not in cat_tags]
        cat_only = [t for t in result if t in cat_tags]
        result = (content[:5] + cat_only)[:5]

    # Ensure minimum 3 tags by adding severity-based tags if needed
    severity = article.get("severity", "")
    if len(result) < 3 and severity:
        severity_map = {
            "critical": "critical-severity",
            "high": "high-severity",
        }
        if severity in severity_map:
            result.append(severity_map[severity])

    # If still < 3, add generic category-related tags
    CATEGORY_EXTRAS = {
        "breaches": ["cybersecurity", "incident"],
        "vulnerabilities": ["security-flaw", "cybersecurity"],
        "malware": ["cybersecurity", "threat"],
        "ransomware": ["extortion", "cybersecurity"],
        "policy": ["cybersecurity", "governance"],
        "tools": ["cybersecurity", "infosec"],
    }
    extras = CATEGORY_EXTRAS.get(category, ["cybersecurity"])
    for extra in extras:
        if len(result) >= 3:
            break
        if extra not in result:
            result.append(extra)

    return sorted(result[:5])


def main():
    with open(ARTICLES_PATH) as f:
        articles = json.load(f)

    updated = 0
    for article in articles:
        if not article.get("tags"):
            article["tags"] = generate_tags(article)
            updated += 1

    with open(ARTICLES_PATH, "w") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    # Stats
    all_tags = set()
    tag_counts = {}
    for a in articles:
        for t in a.get("tags", []):
            all_tags.add(t)
            tag_counts[t] = tag_counts.get(t, 0) + 1

    print(f"Updated {updated} articles")
    print(f"Unique tags: {len(all_tags)}")
    print(f"\nTop 20 tags:")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:20]:
        print(f"  {tag}: {count}")

    # Check min tags
    min_tags = min(len(a["tags"]) for a in articles)
    max_tags = max(len(a["tags"]) for a in articles)
    print(f"\nTag range: {min_tags}-{max_tags} per article")


if __name__ == "__main__":
    main()

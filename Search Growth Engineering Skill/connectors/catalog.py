from __future__ import annotations

from .google.search_console import GoogleSearchConsoleConnector
from .google.analytics import GA4ConnectorAdapter
from .google.ads import GoogleAdsConnectorAdapter
from .google.business_profile import GoogleBusinessProfileConnector
from .microsoft.bing_webmaster import BingWebmasterConnector
from .seo.ahrefs import AhrefsConnector
from .seo.semrush import SemrushConnector
from .seo.screamingfrog import ScreamingFrogConnector
from .seo.serpapi import SerpApiConnector
from .cms.wordpress import WordPressConnector
from .cms.shopify import ShopifyConnector
from .cms.webflow import WebflowConnector
from .dev.github import GitHubConnector
from .dev.gitlab import GitLabConnector
from .dev.bitbucket import BitbucketConnector

CONNECTOR_CLASSES = {
    GoogleSearchConsoleConnector.connector_id: GoogleSearchConsoleConnector,
    GA4ConnectorAdapter.connector_id: GA4ConnectorAdapter,
    GoogleAdsConnectorAdapter.connector_id: GoogleAdsConnectorAdapter,
    GoogleBusinessProfileConnector.connector_id: GoogleBusinessProfileConnector,
    BingWebmasterConnector.connector_id: BingWebmasterConnector,
    AhrefsConnector.connector_id: AhrefsConnector,
    SemrushConnector.connector_id: SemrushConnector,
    ScreamingFrogConnector.connector_id: ScreamingFrogConnector,
    SerpApiConnector.connector_id: SerpApiConnector,
    WordPressConnector.connector_id: WordPressConnector,
    ShopifyConnector.connector_id: ShopifyConnector,
    WebflowConnector.connector_id: WebflowConnector,
    GitHubConnector.connector_id: GitHubConnector,
    GitLabConnector.connector_id: GitLabConnector,
    BitbucketConnector.connector_id: BitbucketConnector,
}

ALIASES = {
    'gsc': 'gsc',
    'google-search-console': 'gsc',
    'search-console': 'gsc',
    'ga4': 'ga4',
    'google-analytics': 'ga4',
    'analytics': 'ga4',
    'ads': 'google-ads',
    'google-ads': 'google-ads',
    'gbp': 'gbp',
    'google-business-profile': 'gbp',
    'business-profile': 'gbp',
    'bing': 'bing-webmaster',
    'bing-webmaster': 'bing-webmaster',
    'ahrefs': 'ahrefs',
    'semrush': 'semrush',
    'screamingfrog': 'screamingfrog',
    'screaming-frog': 'screamingfrog',
    'serp': 'serpapi',
    'serpapi': 'serpapi',
    'wordpress': 'wordpress',
    'shopify': 'shopify',
    'webflow': 'webflow',
    'github': 'github',
    'gitlab': 'gitlab',
    'bitbucket': 'bitbucket',
}

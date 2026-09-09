from __future__ import annotations
import argparse, json
from pathlib import Path
from datetime import date, timedelta

from .discovery.project import discover_project
from .crawl.site import crawl_site
from .audit.technical import audit_crawl
from .scoring.priority import rank_findings
from .storage.json_store import write_json, read_json
from .connectors import SearchConsoleConnector, GA4Connector, GoogleAdsConnector, SERPConnector, ConnectorError
from .analytics import parse_gsc_rows, summarize_gsc, parse_ga4_rows, summarize_ga4
from .search.keywords import cluster_keywords, detect_cannibalization
from .search.serp_analysis import analyze_serp_results
from .baseline.manager import BaselineManager
from .memory import GrowthMemory, summarize_health
from .strategy import build_strategy
from .execution.engine import ExecutionEngine, ExecutionError
from .execution.planner import build_execution_plan
from .execution.validators import ValidationRunner
from .monitor import run_monitor
from .autonomous import run_growth_loop
from .ai_search.providers import load_json, fetch_json
from .ai_search.analyzer import normalize_observations, analyze_observations, detect_source_gaps
from .ai_search.entity_graph import build_entity_graph, detect_entity_gaps
from .ai_search.opportunities import build_ai_opportunities
from .competitors.market_map import build_market_map
from .competitors.gaps import keyword_gap_analysis, paid_organic_overlap
from .competitors.ai_competitors import ai_source_competitor_analysis
from .competitors.changes import detect_competitor_changes
from .content.strategy import build_content_strategy
from .content.authority import build_topic_map, internal_link_graph
from .content.decay import detect_content_decay
from .content.information_gain import score_information_gain
from .orchestrator import orchestrate


def _out(data, path=None):
    if path:
        write_json(path, data)
    print(json.dumps(data, indent=2, ensure_ascii=False))


def _dates(days: int):
    end = date.today() - timedelta(days=3)
    start = end - timedelta(days=days-1)
    return start.isoformat(), end.isoformat()


def main(argv=None):
    p=argparse.ArgumentParser(prog='search-growth-engine')
    sub=p.add_subparsers(dest='cmd',required=True)

    d=sub.add_parser('discover'); d.add_argument('path',nargs='?',default='.'); d.add_argument('--json')
    c=sub.add_parser('crawl'); c.add_argument('url'); c.add_argument('--max-pages',type=int,default=50); c.add_argument('--delay',type=float,default=.15); c.add_argument('--out')
    a=sub.add_parser('audit'); a.add_argument('url'); a.add_argument('--max-pages',type=int,default=50); a.add_argument('--out')
    s=sub.add_parser('priority'); s.add_argument('input'); s.add_argument('--out')

    g=sub.add_parser('gsc'); g.add_argument('--start'); g.add_argument('--end'); g.add_argument('--days',type=int,default=28); g.add_argument('--dimensions',default='query,page'); g.add_argument('--row-limit',type=int,default=25000); g.add_argument('--data-state',default='final'); g.add_argument('--out')
    ga=sub.add_parser('ga4'); ga.add_argument('--start'); ga.add_argument('--end'); ga.add_argument('--days',type=int,default=28); ga.add_argument('--landing-pages',action='store_true'); ga.add_argument('--out')
    ads=sub.add_parser('google-ads'); ads.add_argument('--query',required=True); ads.add_argument('--out')
    serp=sub.add_parser('serp'); serp.add_argument('query'); serp.add_argument('--country'); serp.add_argument('--language'); serp.add_argument('--target-domain'); serp.add_argument('--out')
    kw=sub.add_parser('keywords'); kw.add_argument('input'); kw.add_argument('--out')
    bl=sub.add_parser('baseline'); bl.add_argument('action',choices=['save','compare']); bl.add_argument('input'); bl.add_argument('--root',default='.search-growth-engine'); bl.add_argument('--label',default='snapshot'); bl.add_argument('--out')
    st=sub.add_parser('strategy'); st.add_argument('input'); st.add_argument('--out')
    op=sub.add_parser('opportunities'); op.add_argument('input'); op.add_argument('--out')
    roadmap=sub.add_parser('roadmap'); roadmap.add_argument('input'); roadmap.add_argument('--out')
    ep=sub.add_parser('execution-plan'); ep.add_argument('input'); ep.add_argument('--root',default='.'); ep.add_argument('--out')
    ex=sub.add_parser('execute'); ex.add_argument('plan'); ex.add_argument('--root',default='.'); ex.add_argument('--apply',action='store_true'); ex.add_argument('--out')
    val=sub.add_parser('validate'); val.add_argument('--root',default='.'); val.add_argument('--commands',required=True); val.add_argument('--out')
    mon=sub.add_parser('monitor'); mon.add_argument('config'); mon.add_argument('--root',default='.search-growth-engine'); mon.add_argument('--dry-run',action='store_true'); mon.add_argument('--out')
    gl=sub.add_parser('growth-loop'); gl.add_argument('config'); gl.add_argument('--root',default='.search-growth-engine'); gl.add_argument('--apply',action='store_true'); gl.add_argument('--out')
    ai=sub.add_parser('ai-search'); ai.add_argument('input'); ai.add_argument('--target-domain'); ai.add_argument('--provider',default='file',choices=['file','http-json']); ai.add_argument('--out')
    aig=sub.add_parser('ai-opportunities'); aig.add_argument('input'); aig.add_argument('--target-domain'); aig.add_argument('--out')
    eg=sub.add_parser('entity-graph'); eg.add_argument('input'); eg.add_argument('--out')
    cm=sub.add_parser('market-map'); cm.add_argument('input'); cm.add_argument('--target-domain',required=True); cm.add_argument('--out')
    cg=sub.add_parser('keyword-gaps'); cg.add_argument('input'); cg.add_argument('--target-domain',required=True); cg.add_argument('--out')
    po=sub.add_parser('paid-organic-overlap'); po.add_argument('organic'); po.add_argument('paid'); po.add_argument('--target-domain',required=True); po.add_argument('--out')
    ca=sub.add_parser('ai-competitors'); ca.add_argument('input'); ca.add_argument('--target-domain',required=True); ca.add_argument('--out')
    cc=sub.add_parser('competitor-changes'); cc.add_argument('previous'); cc.add_argument('current'); cc.add_argument('--out')
    ct=sub.add_parser('content-strategy'); ct.add_argument('input'); ct.add_argument('--out')
    tm=sub.add_parser('topic-map'); tm.add_argument('input'); tm.add_argument('--out')
    cd=sub.add_parser('content-decay'); cd.add_argument('current'); cd.add_argument('previous'); cd.add_argument('--threshold',type=float,default=0.25); cd.add_argument('--out')
    ig=sub.add_parser('information-gain'); ig.add_argument('input'); ig.add_argument('--out')
    mem=sub.add_parser('memory'); mem.add_argument('action',choices=['snapshot','compare','digest','change','experiment','insight','health']); mem.add_argument('input',nargs='?',help='JSON input for the selected action'); mem.add_argument('--root',default='.search-growth-engine'); mem.add_argument('--label',default='snapshot'); mem.add_argument('--source',default='unknown'); mem.add_argument('--baseline-id'); mem.add_argument('--type',default='implementation'); mem.add_argument('--title'); mem.add_argument('--status',default='planned'); mem.add_argument('--name'); mem.add_argument('--hypothesis'); mem.add_argument('--metric'); mem.add_argument('--confidence',type=float,default=0.7); mem.add_argument('--action'); mem.add_argument('--out')
    orch=sub.add_parser('orchestrate'); orch.add_argument('path',nargs='?',default='.'); orch.add_argument('--url'); orch.add_argument('--config'); orch.add_argument('--root',default='.search-growth-engine'); orch.add_argument('--apply',action='store_true'); orch.add_argument('--workspace'); orch.add_argument('--workspaces-root'); orch.add_argument('--sync',action='store_true'); orch.add_argument('--observe',action='store_true'); orch.add_argument('--strategy',action='store_true'); orch.add_argument('--monitor',action='store_true'); orch.add_argument('--mode',choices=['audit','strategy','implementation','growth']); orch.add_argument('--out')
    ls=sub.add_parser('live-serp'); ls.add_argument('query'); ls.add_argument('--location'); ls.add_argument('--device'); ls.add_argument('--workspace'); ls.add_argument('--out')
    oai=sub.add_parser('observe-ai'); oai.add_argument('input'); oai.add_argument('--target-domain'); oai.add_argument('--out')
    cit=sub.add_parser('citations'); cit.add_argument('input'); cit.add_argument('--target-domain'); cit.add_argument('--out')
    entp=sub.add_parser('entity-platform'); entp.add_argument('input'); entp.add_argument('--out')
    crep=sub.add_parser('report'); crep.add_argument('--kind',default='executive'); crep.add_argument('--input'); crep.add_argument('--out')

    args=p.parse_args(argv)
    try:
        if args.cmd=='discover': result=discover_project(args.path)
        elif args.cmd=='crawl': result=crawl_site(args.url,args.max_pages,args.delay)
        elif args.cmd=='audit':
            crawl=crawl_site(args.url,args.max_pages,args.delay if hasattr(args,'delay') else .15)
            result={'crawl':crawl,'audit':audit_crawl(crawl)}
        elif args.cmd=='priority':
            data=read_json(args.input); findings=data.get('findings') if isinstance(data,dict) else data; result=rank_findings(findings or [])
        elif args.cmd=='gsc':
            start,end=(args.start,args.end) if args.start and args.end else _dates(args.days)
            dims=[x.strip() for x in args.dimensions.split(',') if x.strip()]
            ev=SearchConsoleConnector().search_analytics(start,end,dims,args.row_limit,args.data_state)
            result={'evidence':ev.to_dict(),'summary':summarize_gsc(parse_gsc_rows(ev.to_dict()))}
        elif args.cmd=='ga4':
            start,end=(args.start,args.end) if args.start and args.end else _dates(args.days)
            if args.landing_pages:
                ev=GA4Connector().organic_landing_pages(start,end)
            else:
                ev=GA4Connector().run_report(start,end,['sessionDefaultChannelGroup'],['sessions','engagedSessions','conversions','totalRevenue'])
            result={'evidence':ev.to_dict(),'rows':parse_ga4_rows(ev.to_dict()),'summary':summarize_ga4(parse_ga4_rows(ev.to_dict()))}
        elif args.cmd=='google-ads':
            ev=GoogleAdsConnector().search_stream(args.query); result={'evidence':ev.to_dict()}
        elif args.cmd=='serp':
            ev=SERPConnector().search(args.query,args.country,args.language); rows=__import__('search-growth-engine', fromlist=['x']) if False else None
            # normalize without unusual import tricks
            from .connectors.serp import normalize_results
            parsed=normalize_results(ev)
            result={'evidence':ev.to_dict(),'analysis':analyze_serp_results(parsed,args.target_domain)}
        elif args.cmd=='keywords':
            data=read_json(args.input)
            if isinstance(data,dict) and 'keywords' in data: keywords=data['keywords']
            elif isinstance(data,list): keywords=data
            else: keywords=[]
            clusters=cluster_keywords(keywords)
            rows=data.get('rows',[]) if isinstance(data,dict) else []
            result={'clusters':clusters,'cannibalization':detect_cannibalization(rows)}
        elif args.cmd=='baseline':
            data=read_json(args.input); manager=BaselineManager(args.root)
            if args.action=='save': result=manager.save_snapshot(data, args.label)
            else: result=manager.compare_latest(data)
        elif args.cmd=='strategy':
            data=read_json(args.input); result=build_strategy(data)
        elif args.cmd=='opportunities':
            data=read_json(args.input); result=build_strategy(data)['opportunities']
        elif args.cmd=='roadmap':
            data=read_json(args.input); result=build_strategy(data)['roadmap']
        elif args.cmd=='execution-plan':
            result=build_execution_plan(read_json(args.input), args.root)
        elif args.cmd=='execute':
            result=ExecutionEngine(args.root).apply(read_json(args.plan), apply=args.apply)
        elif args.cmd=='validate':
            result=ValidationRunner(args.root).run([x.strip() for x in args.commands.split(';;') if x.strip()])
        elif args.cmd=='monitor':
            result=run_monitor(args.config, args.root, dry_run=args.dry_run)
        elif args.cmd=='growth-loop':
            result=run_growth_loop(args.config, args.root, apply=args.apply)
        elif args.cmd=='ai-search':
            provider = load_json(args.input) if args.provider == 'file' else fetch_json(args.input)
            obs = normalize_observations(provider.rows)
            analysis = analyze_observations(obs, args.target_domain)
            gaps = detect_source_gaps(obs, args.target_domain) if args.target_domain else []
            result={'provider':provider.to_dict(),'analysis':analysis,'source_gaps':gaps}
        elif args.cmd=='ai-opportunities':
            data=read_json(args.input)
            result=build_ai_opportunities(data, args.target_domain)
        elif args.cmd=='entity-graph':
            result=build_entity_graph(read_json(args.input))
        elif args.cmd=='market-map':
            data=read_json(args.input)
            result=build_market_map(data.get('serp_rows', data.get('results', [])), args.target_domain, data.get('ai_observations', []), data.get('paid_rows', []))
        elif args.cmd=='keyword-gaps':
            data=read_json(args.input)
            rows=data.get('rows', []) if isinstance(data,dict) else data
            result=keyword_gap_analysis(rows, args.target_domain)
        elif args.cmd=='paid-organic-overlap':
            organic=read_json(args.organic); paid=read_json(args.paid)
            orows=organic.get('rows', []) if isinstance(organic,dict) else organic
            prows=paid.get('rows', []) if isinstance(paid,dict) else paid
            result=paid_organic_overlap(orows, prows, args.target_domain)
        elif args.cmd=='ai-competitors':
            data=read_json(args.input); rows=data.get('rows', []) if isinstance(data,dict) else data
            result=ai_source_competitor_analysis(rows, args.target_domain)
        elif args.cmd=='competitor-changes':
            result=detect_competitor_changes(read_json(args.previous), read_json(args.current))
        elif args.cmd=='content-strategy':
            result=build_content_strategy(read_json(args.input))
        elif args.cmd=='topic-map':
            data=read_json(args.input); pages=(data.get('pages') or data.get('crawl',{}).get('pages') or data.get('crawl',{}).get('results') or []); clusters=data.get('keyword_clusters') or data.get('clusters') or []; entities=(data.get('entity_graph') or {}).get('entities', data.get('entities', [])); result=build_topic_map(clusters, pages, entities)
        elif args.cmd=='content-decay':
            cur=read_json(args.current); prev=read_json(args.previous); cur_rows=cur.get('rows',cur.get('pages',cur)) if isinstance(cur,dict) else cur; prev_rows=prev.get('rows',prev.get('pages',prev)) if isinstance(prev,dict) else prev; result={'decay':detect_content_decay(cur_rows, prev_rows, args.threshold)}
        elif args.cmd=='information-gain':
            data=read_json(args.input); pages=data.get('pages',[]) if isinstance(data,dict) else data; competitor_pages=data.get('competitor_pages',[]) if isinstance(data,dict) else []; result={'pages':score_information_gain(pages, competitor_pages)}
        elif args.cmd=='orchestrate':
            if args.workspace or args.sync or args.observe or args.strategy or args.monitor or args.mode:
                from sge.orchestrator import orchestrate_platform
                result=orchestrate_platform(args.workspace or 'default', project_path=args.path, url=args.url, sync=args.sync, observe=args.observe, strategy=args.strategy, monitor=args.monitor, apply=args.apply, mode=args.mode, workspaces_root=args.workspaces_root)
            else:
                result=orchestrate(args.path, args.url, config_path=args.config, root=args.root, apply=args.apply)
        elif args.cmd=='live-serp':
            from .live_serp import collect_live_serp
            result=collect_live_serp(args.query, location=args.location, device=args.device, workspace=args.workspace)
        elif args.cmd=='observe-ai':
            from .ai_search.observe import observe_ai_search
            from .citations import build_citation_intelligence
            data=read_json(args.input); rows=data.get('observations', data.get('rows', data if isinstance(data,list) else []))
            observed=observe_ai_search(rows if isinstance(rows,list) else [])
            result={'observed':observed,'citations':build_citation_intelligence(observed['observations'], target_domain=args.target_domain)}
        elif args.cmd=='citations':
            from .citations import build_citation_intelligence
            data=read_json(args.input); rows=data.get('observations', data.get('rows', data if isinstance(data,list) else []))
            result=build_citation_intelligence(rows if isinstance(rows,list) else [], target_domain=args.target_domain)
        elif args.cmd=='entity-platform':
            from .entities import build_entity_platform
            result=build_entity_platform(read_json(args.input))
        elif args.cmd=='report':
            from reporting import generate_report
            evidence=read_json(args.input) if args.input else {}
            result=generate_report(args.kind, evidence, formats=['json','markdown'])
            result.get('formats', {}).pop('pdf_bytes', None)
        elif args.cmd=='memory':
            manager=GrowthMemory(args.root)
            if args.action=='snapshot':
                result=manager.snapshot(read_json(args.input) if args.input else {}, args.label, args.source)
            elif args.action=='compare':
                result=manager.changes_since(read_json(args.input) if args.input else {}, args.baseline_id)
            elif args.action=='digest':
                result=manager.digest()
            elif args.action=='change':
                result=manager.record_change(args.type, args.title or 'Unnamed change', read_json(args.input) if args.input else {}, args.status)
            elif args.action=='experiment':
                result=manager.record_experiment(args.name or 'Unnamed experiment', args.hypothesis or '', args.metric or '', status=args.status, details=read_json(args.input) if args.input else {})
            elif args.action=='insight':
                payload=read_json(args.input) if args.input else {}
                result=manager.add_insight(payload.get('statement',''), payload.get('evidence',[]), args.confidence, args.action)
            elif args.action=='health':
                current=read_json(args.input) if args.input else {}
                result=summarize_health(manager.changes_since(current, args.baseline_id))
        _out(result, getattr(args,'out',None) or getattr(args,'json',None))
    except ConnectorError as exc:
        raise SystemExit(f'Connector error: {exc}')

if __name__=='__main__': main()

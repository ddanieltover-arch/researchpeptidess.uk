// @ts-nocheck
import React from 'react';

interface WidgetProps {
  name: string;
  children: React.ReactNode;
}

interface WidgetState {
  hasError: boolean;
  retryKey: number;
}

export class WidgetErrorBoundary extends React.Component<WidgetProps, WidgetState> {
  constructor(props: WidgetProps) {
    super(props);
    this.state = { hasError: false, retryKey: 0 };
  }

  static getDerivedStateFromError(): Partial<WidgetState> {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
          <p className="font-mono font-bold">{this.props.name} could not load</p>
          <p className="mt-1">The rest of the console remains available.</p>
          <button
            type="button"
            className="mt-3 rounded-md border border-amber-400 px-3 py-1 font-mono uppercase"
            onClick={() => this.setState((current) => ({ hasError: false, retryKey: current.retryKey + 1 }))}
          >
            Retry
          </button>
        </div>
      );
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}

interface RouteState {
  hasError: boolean;
}

export class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, RouteState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RouteState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-mono text-xl font-bold text-slate-900">This page could not be displayed</h1>
          <p className="mt-2 text-sm text-slate-600">
            Other routes remain available. Refresh the page or return to the catalogue.
          </p>
          <a href="/" className="mt-4 inline-block font-mono text-xs font-bold uppercase text-[#4353FF]">
            Return home
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

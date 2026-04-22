import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin dashboard crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-6 sm:p-8 max-w-lg w-full">
            <div className="flex items-start gap-3 mb-4">
              <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px] text-red-600">error</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-[#0F172A]">Something went wrong</h1>
                <p className="text-sm text-[#64748B] mt-1">
                  The admin dashboard encountered an error. Try reloading — if it keeps happening, check the browser console for details.
                </p>
              </div>
            </div>

            {this.state.error && (
              <pre className="bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl p-3 text-[11px] text-red-600 overflow-auto max-h-48 mb-4">
                {this.state.error.message}
                {this.state.error.stack && "\n\n" + this.state.error.stack.split("\n").slice(0, 5).join("\n")}
              </pre>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all"
              >
                Reload page
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="px-4 py-2 border border-[#E2E8F0] text-[#334155] text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#F1F5F9] transition-all"
              >
                Go to home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

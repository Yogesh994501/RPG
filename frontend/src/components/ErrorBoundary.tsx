import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChronoSlayer UI crashed gracefully:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen">
          <div className="error-boundary-card">
            <div className="error-icon-wrapper">
              <ShieldAlert size={48} className="text-red-400" />
            </div>
            <h1 className="error-title">The Hero Stumbled, But Shall Rise Again</h1>
            <p className="error-message">
              A spatial rift interrupted your quest: {this.state.error?.message || 'Unexpected anomaly detected.'}
            </p>
            <div className="error-actions">
              <button onClick={this.handleReset} className="rpg-btn rpg-btn-gold flex items-center gap-2">
                <RotateCcw size={18} />
                <span>Re-channel Mana & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

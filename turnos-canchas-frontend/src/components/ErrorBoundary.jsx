import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="main-content" role="alert">
          <h1>Ocurrió un error inesperado</h1>
          <p>Actualizá la página o volvé a intentarlo más tarde.</p>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

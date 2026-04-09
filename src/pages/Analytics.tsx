import Header from '@/components/Header';
import NavPills from '@/components/NavPills';
import EstimatingAnalytics from '@/components/EstimatingAnalytics';

const Analytics = () => {
  return (
    <div className="min-h-screen tactical-grid">
      <Header />
      <NavPills />
      <main className="px-6 py-6 max-w-6xl">
        <EstimatingAnalytics />
      </main>
    </div>
  );
};

export default Analytics;

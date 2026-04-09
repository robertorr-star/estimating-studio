import Header from '@/components/Header';
import NavPills from '@/components/NavPills';
import EstimatesDashboard from '@/components/EstimatesDashboard';

const Index = () => {
  return (
    <div className="min-h-screen tactical-grid">
      <Header />
      <NavPills />
      <main className="px-6 py-6">
        <EstimatesDashboard />
      </main>
    </div>
  );
};

export default Index;

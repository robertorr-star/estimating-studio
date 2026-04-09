import Header from '@/components/Header';
import NavPills from '@/components/NavPills';
import EstimateBuilder from '@/components/EstimateBuilder';

const NewEstimate = () => {
  return (
    <div className="min-h-screen tactical-grid">
      <Header />
      <NavPills />
      <main className="px-6 py-6">
        <EstimateBuilder />
      </main>
    </div>
  );
};

export default NewEstimate;

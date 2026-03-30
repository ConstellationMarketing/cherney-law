import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ImportJob } from '@site/lib/importer/types';

export default function ImportHistory() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    const { data } = await supabase
      .from('import_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setJobs((data as ImportJob[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No import jobs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Import History</h2>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Type</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Source</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Total</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Created</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Failed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-600">
                  {new Date(job.created_at).toLocaleDateString()}{' '}
                  {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {job.template_type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{job.source_type}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-2.5 text-gray-600">{job.total_records}</td>
                <td className="px-4 py-2.5 text-green-600 font-medium">{job.created_count}</td>
                <td className="px-4 py-2.5 text-red-600 font-medium">{job.failed_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}

import { useEffect, useState } from 'react';
import { useUserRole } from '../../hooks/useUserRole';
import { supabase } from '../../lib/supabase';
import type { Template } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileCode } from 'lucide-react';

export default function AdminTemplates() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('page_type', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  // Admin-only page - show access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">You don't have permission to manage templates. Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
        <p className="text-gray-500 mt-1">
          View available page templates. Templates provide pre-built content structures when creating new pages.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileCode className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {template.page_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {template.default_meta_description || 'No description provided'}
              </CardDescription>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Default Content Blocks:</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {template.default_content.map((block, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-slate-300 rounded-full" />
                      <span className="capitalize">{block.type.replace('-', ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {template.default_meta_title && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Meta Title Pattern:</span><br />
                    {template.default_meta_title}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No templates found. Templates are created in the database.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

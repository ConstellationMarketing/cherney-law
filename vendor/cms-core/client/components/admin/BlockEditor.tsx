import { useState } from 'react';
import type { ContentBlock } from '../../lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Type,
  Image,
  List,
  Phone,
  Layout,
  Users,
  Grid,
  MessageSquare,
  MapPin,
  Columns,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BlockEditorProps {
  content: ContentBlock[];
  onChange: (content: ContentBlock[]) => void;
}

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Section', icon: Layout },
  { type: 'heading', label: 'Heading', icon: Type },
  { type: 'paragraph', label: 'Paragraph', icon: FileText },
  { type: 'bullets', label: 'Bullet List', icon: List },
  { type: 'cta', label: 'Call to Action', icon: Phone },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'attorney-bio', label: 'Attorney Bio', icon: Users },
  { type: 'services-grid', label: 'Services Grid', icon: Grid },
  { type: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { type: 'contact-form', label: 'Contact Form', icon: MessageSquare },
  { type: 'map', label: 'Map', icon: MapPin },
  { type: 'two-column', label: 'Two Columns', icon: Columns },
  { type: 'practice-areas-grid', label: 'Practice Areas Grid', icon: Grid },
] as const;

function getDefaultBlock(type: string): ContentBlock {
  switch (type) {
    case 'hero':
      return { type: 'hero', title: 'Page Title', subtitle: 'Page subtitle', showCTA: false };
    case 'heading':
      return { type: 'heading', level: 2, text: 'Section Heading' };
    case 'paragraph':
      return { type: 'paragraph', content: '<p>Enter your content here...</p>' };
    case 'bullets':
      return { type: 'bullets', items: ['Item 1', 'Item 2', 'Item 3'] };
    case 'cta':
      return { type: 'cta', text: 'Call Us Today', phone: '404-905-7742', variant: 'primary' };
    case 'image':
      return { type: 'image', src: '/placeholder.svg', alt: 'Image description' };
    case 'attorney-bio':
      return { type: 'attorney-bio', name: 'Attorney Name', title: 'Title', image: '/placeholder.svg', bio: 'Attorney bio...', phone: '404-905-7742' };
    case 'services-grid':
      return { type: 'services-grid', services: [{ icon: 'Car', title: 'Service Title', description: 'Service description' }] };
    case 'testimonials':
      return { type: 'testimonials', testimonials: [{ initials: 'JD', text: 'Great service!', rating: 5 }] };
    case 'contact-form':
      return { type: 'contact-form', heading: 'Contact Us' };
    case 'map':
      return { type: 'map', address: '4120 Presidential Parkway, Suite 200, Atlanta, GA 30340' };
    case 'two-column':
      return { type: 'two-column', left: [], right: [] };
    case 'practice-areas-grid':
      return { type: 'practice-areas-grid', areas: [{ icon: 'Car', title: 'Practice Area', description: 'Description' }] };
    default:
      return { type: 'paragraph', content: '' };
  }
}

export default function BlockEditor({ content, onChange }: BlockEditorProps) {
  const addBlock = (type: string) => {
    const newBlock = getDefaultBlock(type);
    onChange([...content, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<ContentBlock>) => {
    const newContent = [...content];
    newContent[index] = { ...newContent[index], ...updates } as ContentBlock;
    onChange(newContent);
  };

  const removeBlock = (index: number) => {
    onChange(content.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= content.length) return;
    
    const newContent = [...content];
    [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
    onChange(newContent);
  };

  return (
    <div className="space-y-4">
      {content.map((block, index) => (
        <BlockCard
          key={index}
          block={block}
          index={index}
          total={content.length}
          onUpdate={(updates) => updateBlock(index, updates)}
          onRemove={() => removeBlock(index)}
          onMove={(dir) => moveBlock(index, dir)}
        />
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <DropdownMenuItem key={type} onClick={() => addBlock(type)}>
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface BlockCardProps {
  block: ContentBlock;
  index: number;
  total: number;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

function BlockCard({ block, index, total, onUpdate, onRemove, onMove }: BlockCardProps) {
  const [expanded, setExpanded] = useState(true);
  const blockInfo = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = blockInfo?.icon || FileText;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          <Icon className="h-4 w-4 text-gray-500" />
          <CardTitle 
            className="text-sm font-medium flex-1 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            {blockInfo?.label || block.type}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('up')}
              disabled={index === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove('down')}
              disabled={index === total - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <BlockFields block={block} onUpdate={onUpdate} />
        </CardContent>
      )}
    </Card>
  );
}

function BlockFields({ block, onUpdate }: { block: ContentBlock; onUpdate: (updates: Partial<ContentBlock>) => void }) {
  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input value={block.subtitle || ''} onChange={(e) => onUpdate({ subtitle: e.target.value })} />
          </div>
          <div>
            <Label>Background Image URL</Label>
            <Input value={block.backgroundImage || ''} onChange={(e) => onUpdate({ backgroundImage: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={block.showCTA || false} onCheckedChange={(checked) => onUpdate({ showCTA: checked })} />
            <Label>Show Call-to-Action Button</Label>
          </div>
        </div>
      );

    case 'heading':
      return (
        <div className="space-y-4">
          <div>
            <Label>Text</Label>
            <Input value={block.text} onChange={(e) => onUpdate({ text: e.target.value })} />
          </div>
          <div>
            <Label>Level</Label>
            <Select value={String(block.level)} onValueChange={(v) => onUpdate({ level: Number(v) as 1 | 2 | 3 })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1 - Main Title</SelectItem>
                <SelectItem value="2">H2 - Section Title</SelectItem>
                <SelectItem value="3">H3 - Subsection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <div>
          <Label>Content (HTML supported)</Label>
          <Textarea
            value={block.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            rows={4}
          />
        </div>
      );

    case 'bullets':
      return (
        <div className="space-y-2">
          <Label>Items (one per line)</Label>
          <Textarea
            value={block.items.join('\n')}
            onChange={(e) => onUpdate({ items: e.target.value.split('\n').filter(Boolean) })}
            rows={4}
          />
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-4">
          <div>
            <Label>Button Text</Label>
            <Input value={block.text} onChange={(e) => onUpdate({ text: e.target.value })} />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={block.phone} onChange={(e) => onUpdate({ phone: e.target.value })} />
          </div>
          <div>
            <Label>Style</Label>
            <Select value={block.variant || 'primary'} onValueChange={(v) => onUpdate({ variant: v as 'primary' | 'outline' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary (Filled)</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-4">
          <div>
            <Label>Image URL</Label>
            <Input value={block.src} onChange={(e) => onUpdate({ src: e.target.value })} />
          </div>
          <div>
            <Label>Alt Text</Label>
            <Input value={block.alt} onChange={(e) => onUpdate({ alt: e.target.value })} />
          </div>
        </div>
      );

    case 'attorney-bio':
      return (
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={block.name} onChange={(e) => onUpdate({ name: e.target.value })} />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} />
          </div>
          <div>
            <Label>Image URL</Label>
            <Input value={block.image} onChange={(e) => onUpdate({ image: e.target.value })} />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={block.bio} onChange={(e) => onUpdate({ bio: e.target.value })} rows={4} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={block.phone} onChange={(e) => onUpdate({ phone: e.target.value })} />
          </div>
        </div>
      );

    case 'contact-form':
      return (
        <div>
          <Label>Heading</Label>
          <Input value={block.heading ?? ""} onChange={(e) => onUpdate({ heading: e.target.value })} />
        </div>
      );

    case 'map':
      return (
        <div>
          <Label>Address</Label>
          <Input value={block.address} onChange={(e) => onUpdate({ address: e.target.value })} />
        </div>
      );

    case 'services-grid':
    case 'practice-areas-grid':
      const items = block.type === 'services-grid' ? block.services : block.areas;
      const itemKey = block.type === 'services-grid' ? 'services' : 'areas';
      return (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <Label>Item {idx + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ [itemKey]: items.filter((_, i) => i !== idx) })}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Icon (e.g., Car, Truck)"
                value={item.icon}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx] = { ...newItems[idx], icon: e.target.value };
                  onUpdate({ [itemKey]: newItems });
                }}
              />
              <Input
                placeholder="Title"
                value={item.title}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx] = { ...newItems[idx], title: e.target.value };
                  onUpdate({ [itemKey]: newItems });
                }}
              />
              <Textarea
                placeholder="Description"
                value={item.description}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx] = { ...newItems[idx], description: e.target.value };
                  onUpdate({ [itemKey]: newItems });
                }}
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => onUpdate({ [itemKey]: [...items, { icon: 'FileText', title: 'New Item', description: '' }] })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      );

    case 'testimonials':
      return (
        <div className="space-y-4">
          {block.testimonials.map((testimonial, idx) => (
            <div key={idx} className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <Label>Testimonial {idx + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ testimonials: block.testimonials.filter((_, i) => i !== idx) })}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Initials (e.g., JD)"
                value={testimonial.initials}
                onChange={(e) => {
                  const newTestimonials = [...block.testimonials];
                  newTestimonials[idx] = { ...newTestimonials[idx], initials: e.target.value };
                  onUpdate({ testimonials: newTestimonials });
                }}
              />
              <Textarea
                placeholder="Testimonial text"
                value={testimonial.text}
                onChange={(e) => {
                  const newTestimonials = [...block.testimonials];
                  newTestimonials[idx] = { ...newTestimonials[idx], text: e.target.value };
                  onUpdate({ testimonials: newTestimonials });
                }}
              />
              <Select
                value={String(testimonial.rating)}
                onValueChange={(v) => {
                  const newTestimonials = [...block.testimonials];
                  newTestimonials[idx] = { ...newTestimonials[idx], rating: Number(v) };
                  onUpdate({ testimonials: newTestimonials });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} Stars</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => onUpdate({ testimonials: [...block.testimonials, { initials: '', text: '', rating: 5 }] })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      );

    default:
      return <p className="text-gray-500">No editor available for this block type</p>;
  }
}

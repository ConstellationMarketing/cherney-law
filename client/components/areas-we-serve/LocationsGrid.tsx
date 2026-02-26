import type { LocationItem } from '../../lib/cms/areasWeServePageTypes';

interface LocationsGridProps {
  items: LocationItem[];
}

export default function LocationsGrid({ items }: LocationsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((location, index) => (
        <LocationCard key={index} location={location} />
      ))}
    </div>
  );
}

function LocationCard({ location }: { location: LocationItem }) {
  const content = (
    <div className="flex flex-col gap-2">
      <h4 className="text-lg font-semibold text-black font-outfit">{location.name}</h4>
      {location.description && (
        <p className="text-sm text-gray-600">{location.description}</p>
      )}
    </div>
  );

  if (location.href) {
    return (
      <a
        href={location.href}
        className="block p-6 border-2 border-black bg-white rounded-lg hover:border-law-accent hover:shadow-md transition-all duration-200"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="p-6 border-2 border-black bg-white rounded-lg">
      {content}
    </div>
  );
}

import React, { useState } from 'react';
import { ChefHat, Clock, CheckCircle2, RefreshCw, AlertCircle, ShoppingBag, Truck, Calendar } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

interface KitchenViewProps {
  orders: Order[];
  onRefresh: () => void;
}

export const KitchenView: React.FC<KitchenViewProps> = ({ orders, onRefresh }) => {
  const [updatingSlot, setUpdatingSlot] = useState<string | null>(null);

  // Filter today's confirmed or preparing or new orders
  const activeOrders = orders.filter(
    o => o.status === 'New' || o.status === 'Confirmed' || o.status === 'Preparing'
  );

  // Slots: Morning, Evening, ASAP/Other
  const slots = [
    { id: 'Morning', label: 'Morning Slot (10:00 AM – 2:00 PM)' },
    { id: 'Evening', label: 'Evening Slot (4:00 PM – 9:00 PM)' },
    { id: 'ASAP', label: 'ASAP / Standard Deliveries' },
  ];

  const getOrdersInSlot = (slotId: string) => {
    return activeOrders.filter(o => {
      const s = (o.delivery_slot || '').toLowerCase();
      if (slotId === 'Morning') return s.includes('morning');
      if (slotId === 'Evening') return s.includes('evening');
      return !s.includes('morning') && !s.includes('evening');
    });
  };

  // Aggregate items in a slot (e.g. "Pistachio Khoya Barfi: 3.5 kg", "Gulab Jamun: 2 kg")
  const aggregateItemsInSlot = (slotOrders: Order[]) => {
    const itemMap: Record<string, { quantity: number; unit: string }> = {};

    slotOrders.forEach(o => {
      o.items.forEach(it => {
        const key = `${it.name.trim()}__${it.unit.trim().toLowerCase()}`;
        if (!itemMap[key]) {
          itemMap[key] = { quantity: 0, unit: it.unit };
        }
        itemMap[key].quantity += it.quantity;
      });
    });

    return Object.entries(itemMap).map(([key, data]) => {
      const name = key.split('__')[0];
      return {
        name,
        quantity: data.quantity,
        unit: data.unit
      };
    });
  };

  const handleMarkSlotReady = async (slotId: string, slotOrders: Order[]) => {
    if (slotOrders.length === 0) return;
    setUpdatingSlot(slotId);
    try {
      // Mark all orders in this slot as "Preparing" or "Out for Delivery"
      for (const ord of slotOrders) {
        if (ord.status !== 'Preparing') {
          await api.updateOrderStatus(ord.id, 'Preparing', `Batch cooking initiated for ${slotId} slot`);
        }
      }
      onRefresh();
    } catch (e: any) {
      alert('Error updating slot status: ' + e.message);
    } finally {
      setUpdatingSlot(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-[#8C4A1A] rounded-full text-xs font-semibold mb-2">
            <ChefHat className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>Halwai & Kitchen Kadhai Production Schedule</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#2A170A]">
            Kitchen Production View
          </h3>
          <p className="text-xs text-[#8C6D58]">
            Auto-refreshes every 60s. Grouped by delivery slot with aggregated batch weights for the kadhai.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white border border-[#D9C8B4] hover:bg-[#FAF7F2] text-[#2A170A] rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start cursor-pointer transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#C2410C]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {slots.map(slot => {
          const slotOrders = getOrdersInSlot(slot.id);
          const aggregated = aggregateItemsInSlot(slotOrders);

          return (
            <div 
              key={slot.id}
              className="bg-white rounded-3xl border border-[#EAE2D5] p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-[#F2ECE1]">
                  <div>
                    <h4 className="text-sm font-serif font-bold text-[#2A170A]">{slot.label}</h4>
                    <span className="text-[11px] text-[#8C6D58] font-medium">
                      {slotOrders.length} {slotOrders.length === 1 ? 'order' : 'orders'} pending
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    slotOrders.length > 0 ? 'bg-amber-100 text-[#C2410C]' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {slotOrders.length}
                  </span>
                </div>

                {/* Aggregated Recipe Totals */}
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#8C6D58] block">
                    Aggregated Batch Cooking Total
                  </span>
                  {aggregated.length > 0 ? (
                    <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#EAE2D5] space-y-1.5">
                      {aggregated.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#2A170A]">{item.name}</span>
                          <strong className="text-[#C2410C] font-mono font-bold">
                            {item.quantity} {item.unit}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[#8C6D58] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#D9C8B4]">
                      No orders scheduled for this slot.
                    </div>
                  )}
                </div>

                {/* Individual Orders in this slot */}
                {slotOrders.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#F2ECE1]">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-[#8C6D58] block">
                      Assigned Order Numbers
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {slotOrders.map(ord => (
                        <div key={ord.id} className="p-2.5 bg-white rounded-xl border border-[#EAE2D5] text-xs flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold text-[#2A170A] block">{ord.order_number}</span>
                            <span className="text-[11px] text-[#8C6D58]">{ord.customer_name}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            ord.status === 'Preparing' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Slot Action Button */}
              <button
                type="button"
                onClick={() => handleMarkSlotReady(slot.id, slotOrders)}
                disabled={slotOrders.length === 0 || updatingSlot === slot.id}
                className="w-full py-2.5 bg-[#2A170A] hover:bg-[#C2410C] disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {updatingSlot === slot.id ? 'Updating Slot...' : 'Mark Slot as Preparing'}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

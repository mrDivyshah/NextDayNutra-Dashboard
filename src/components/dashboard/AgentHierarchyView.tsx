"use client";

import React, { useState } from "react";
import { Order } from "@/types/dashboard";
import { ChevronRight, ChevronDown, Info } from "lucide-react";
import { OrderFilesPreview } from "./OrderFiles";
import AssetVault from "@/components/AssetVault";

interface AgentHierarchyViewProps {
  orders: Order[];
  liveCustomers: { id: number; name: string; users: { id: number }[] }[];
}

const InfoTooltip = ({ title, content, iconColor = '#b4bfc9' }: { title?: string | React.ReactNode, content: React.ReactNode, iconColor?: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, transformX: '-50%', transformY: '-100%' });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 280;
    const padding = 20;
    
    let leftPos = rect.left + rect.width / 2;
    let transformX = '-50%';
    let topPos = rect.top - 10;
    let transformY = '-100%';
    
    // Check right edge collision
    if (leftPos + (tooltipWidth / 2) > window.innerWidth - padding) {
      leftPos = rect.right;
      transformX = '-100%';
    } 
    // Check left edge collision
    else if (leftPos - (tooltipWidth / 2) < padding) {
      leftPos = rect.left;
      transformX = '0%';
    }

    // Check top edge collision (if there isn't enough space above, render it below)
    if (topPos - 150 < 0) { // Approx 150px height
      topPos = rect.bottom + 10;
      transformY = '0%';
    }

    setCoords({
      left: leftPos,
      top: topPos,
      transformX,
      transformY
    });
    setIsHovered(true);
  };

  return (
    <div 
      style={{ display: 'flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Info size={14} style={{ color: iconColor, cursor: 'help' }} />
      {isHovered && typeof window !== 'undefined' && (
        <div style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          transform: `translate(${coords.transformX}, ${coords.transformY})`,
          width: '280px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(5px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          borderLeft: '3px solid #4a4a4a',
          borderRadius: '4px',
          padding: '12px 15px',
          zIndex: 10000,
          color: '#0f172a',
          fontSize: '12px',
          lineHeight: '1.4',
          textAlign: 'left',
          pointerEvents: 'none',
          whiteSpace: 'normal',
        }}>
          {title && <div style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{title}</div>}
          <div style={{ margin: 0 }}>{content}</div>
        </div>
      )}
    </div>
  );
};

export function AgentHierarchyView({ orders, liveCustomers }: AgentHierarchyViewProps) {
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const resolveCustomerId = (customerName: string) => {
    const normalized = customerName.trim().toLowerCase();
    const match = liveCustomers.find((customer) => customer.name.trim().toLowerCase() === normalized);
    return match?.users?.[0]?.id ?? match?.id ?? 0;
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const toggleCustomer = (customerName: string) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerName]: !prev[customerName]
    }));
  };

  const toggleOrder = (orderKey: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderKey]: !prev[orderKey]
    }));
  };

  const hierarchy: Record<string, Record<string, { orders: Order[], paid: number, pending: number, balance: number, total: number }>> = {};
  
  orders.forEach(order => {
    const agentName = order.agentName;
    if (!agentName || agentName === 'Unassigned') return; 

    const customerName = order.customer;
    
    if (!hierarchy[agentName]) hierarchy[agentName] = {};
    if (!hierarchy[agentName][customerName]) {
      hierarchy[agentName][customerName] = { orders: [], paid: 0, pending: 0, balance: 0, total: 0 };
    }
    
    hierarchy[agentName][customerName].orders.push(order);
    hierarchy[agentName][customerName].paid += (order.commissionPaid || 0);
    hierarchy[agentName][customerName].pending += (order.commissionDue || 0);
    hierarchy[agentName][customerName].balance += (order.commissionBalanceOwed || 0);
    hierarchy[agentName][customerName].total += (order.commissionTotal || 0);
  });

  const sortedAgents = Object.keys(hierarchy).sort();

  return (
    <div className="agent-hierarchy-view">
      {sortedAgents.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#FFF', background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
          No agent data found for the current selection.
        </div>
      ) : (
        sortedAgents.map((agentName) => {
          const customers = hierarchy[agentName];
          return (
            <section key={agentName} className="agent-section" style={{ 
              background: '#91abcb', 
              marginBottom: 20, 
              padding: '10px 10px 10px 10px', 
              borderRadius: 6 
            }}>
              <h4 className="agent-title" style={{ 
                fontSize: 15, 
                fontWeight: 700, 
                color: '#123E67', 
                marginBottom: 10, 
                textTransform: 'uppercase' 
              }}>
                AGENT: {agentName}
              </h4>
              
              <div className="customer-cards" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {Object.entries(customers).map(([customerName, data]) => {
                  const isExpanded = expandedCustomers[customerName];
                  return (
                    <div key={customerName} className="customer-card-container" style={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: 6, 
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}>
                      <div 
                        className="customer-card-header" 
                        onClick={() => toggleCustomer(customerName)}
                        style={{ 
                          padding: '15px 24px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          borderBottom: isExpanded ? '1px solid #f0f2f5' : 'none'
                        }}
                      >
                        <strong style={{ fontSize: 16, color: '#1e293b' }}>{customerName}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div className="meta-info" style={{ 
                            fontSize: 13, 
                            color: '#64748b', 
                            fontWeight: 500, 
                            textAlign: 'right' 
                          }}>
                            Orders: {data.orders.length} | Paid: {formatCurrency(data.paid)} | Pending: {formatCurrency(data.pending)}
                          </div>
                          {isExpanded ? <ChevronDown size={18} style={{ color: '#F05323' }} /> : <ChevronRight size={18} style={{ color: '#F05323' }} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="customer-card-details" style={{ padding: '24px', backgroundColor: '#FFF' }}>
                          <div className="expanded-summary" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(4, 1fr)', 
                            gap: 1, 
                            backgroundColor: '#e1e8ed',
                            marginBottom: 25,
                            borderRadius: 6,
                            overflow: 'hidden',
                            border: '1px solid #e1e8ed'
                          }}>
                            {[
                               { label: 'TOTAL ORDERS', value: data.orders.length },
                               { label: 'TOTAL PAID', value: formatCurrency(data.paid) },
                               { label: 'TOTAL AMOUNT PENDING', value: formatCurrency(data.pending) },
                               { label: 'TOTAL BALANCE PENDING', value: formatCurrency(data.balance) }
                            ].map((item, idx) => (
                              <div key={idx} style={{ 
                                backgroundColor: '#91abcb', 
                                padding: '20px', 
                                textAlign: 'center',
                                color: '#123E67'
                              }}>
                                <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 10 }}>{item.label}</div>
                                <div style={{ fontSize: 24, fontWeight: 700 }}>{item.value}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: '1px solid #e1e8ed' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e1e8ed' }}>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Sales Order #</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Product Name</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Status</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Quantity Ordered</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Quoted Order Total</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Final Order Total</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Days in Production</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>EST Ship</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Customer Payment Status</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Commission %</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Commission Total</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Commission Balance Owed</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Commission Paid</th>
                                  <th style={{ textAlign: 'left', padding: '12px 8px', color: '#64748b' }}>Commission Due</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.orders.map((order, oidx) => {
                                  const orderKey = order.cmKey || String(oidx);
                                  const isOrderExpanded = expandedOrders[orderKey];
                                  const resolvedCustomerId = resolveCustomerId(order.customer || customerName);
                                  // In Agent view, we allow expansion to see files/notes
                                  const hasNotes = order.notes && order.notes.length > 0;
                                  const canExpand = true; // Always allow expansion for files now
                                  
                                  const isCommPaid = order.commissionPaid && order.commissionPaid > 0;
                                  const commPaidBg = isCommPaid ? '#dcfce7' : '#fef9c3';
                                  const commPaidText = isCommPaid ? '#166534' : '#854d0e';
                                  
                                  let payStatusBg = '#95bae7';
                                  let payStatusText = '#003778';
                                  if (order.customerPaymentStatus === 'Paid In Full') {
                                    payStatusBg = '#dcfce7';
                                    payStatusText = '#166534';
                                  } else if (order.customerPaymentStatus === 'UnPaid') {
                                    payStatusBg = '#fef9c3';
                                    payStatusText = '#854d0e';
                                  }

                                  const isFullyPaidOrder = order.customerPaymentStatus === 'Paid In Full' && (!order.commissionDue || order.commissionDue === 0);
                                  const rowBgStyle = isFullyPaidOrder ? { backgroundColor: '#dcfce7', color: '#166534' } : { backgroundColor: '#ffffff' };

                                  return (
                                    <React.Fragment key={orderKey}>
                                      <tr style={{ borderBottom: '1px solid #f0f2f5', ...rowBgStyle }}>
                                        <td 
                                          style={{ padding: '15px 8px', fontWeight: 700, color: '#123E67', cursor: 'pointer' }}
                                          onClick={() => toggleOrder(orderKey)}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            {isOrderExpanded ? <ChevronDown size={14} style={{ color: '#F05323' }} /> : <ChevronRight size={14} style={{ color: '#F05323' }} />}
                                            {order.so}
                                          </div>
                                        </td>
                                        <td style={{ padding: '15px 8px' }}>{order.product}</td>
                                        <td style={{ padding: '15px 8px' }}>{order.status}</td>
                                        <td style={{ padding: '15px 8px' }}>{order.qty.toLocaleString()}</td>
                                        <td style={{ padding: '15px 8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {formatCurrency(order.quotedOrderTotal)}
                                            <InfoTooltip 
                                              title="Quoted Order Total"
                                              content={<p style={{ margin: 0 }}>The projected total value of the order based on the Quantity Ordered and agreed Unit Price at the time of quoting.</p>}
                                            />
                                          </div>
                                        </td>
                                        <td style={{ padding: '15px 8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {order.finalOrderTotal ? formatCurrency(order.finalOrderTotal) : 'N/A'}
                                            <InfoTooltip 
                                              title="Final Order Total"
                                              content={<p style={{ margin: 0 }}>The confirmed total value of the order after production is complete. This is based on the actual total yield and the agreed unit price from the customer quote. Once available, this amount replaces the Quoted Order Total for commission calculations.</p>}
                                            />
                                          </div>
                                        </td>
                                        <td style={{ padding: '15px 8px', textAlign: 'center' }}>{order.days}</td>
                                        <td style={{ padding: '15px 8px' }}>{order.est}</td>
                                        <td style={{ padding: '15px 8px' }}>
                                          <span style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: 20, 
                                            backgroundColor: payStatusBg, 
                                            color: payStatusText, 
                                            fontSize: 11,
                                            fontWeight: 600
                                          }}>
                                            {order.customerPaymentStatus}
                                          </span>
                                        </td>
                                        <td style={{ padding: '15px 8px' }}>{order.commissionPercent?.toFixed(2)}%</td>
                                        <td style={{ padding: '15px 8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {formatCurrency(order.commissionTotal)}
                                            <InfoTooltip 
                                              title="Total Commission"
                                              content={<p style={{ margin: 0 }}>The total commission earned for this order. This amount is projected based on the Quoted Order Total until the Final Order Total has been confirmed.</p>}
                                            />
                                          </div>
                                        </td>
                                        <td style={{ padding: '15px 8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {formatCurrency(order.commissionBalanceOwed)}
                                            <InfoTooltip 
                                              title="Commission Balance Owed"
                                              content={
                                                <>
                                                  <p style={{ margin: '0 0 8px 0' }}>The remaining commission expected for this order that has not yet been earned or paid.</p>
                                                  <p style={{ margin: 0 }}>While the order is in progress, this amount is projected. Once confirmed, this reflects the balance tied to outstanding payments.</p>
                                                </>
                                              }
                                            />
                                          </div>
                                        </td>
                                        <td style={{ padding: '15px 8px', backgroundColor: commPaidBg, color: commPaidText, fontWeight: 700 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {formatCurrency(order.commissionPaid)}
                                            <InfoTooltip 
                                              iconColor={isCommPaid ? '#059669' : '#ca8a04'}
                                              content={
                                                <div style={{ width: '100%' }}>
                                                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#1e293b' }}>
                                                    {order.product || 'N/A'}
                                                  </h4>
                                                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', background: 'transparent' }}>
                                                    <tbody>
                                                      <tr>
                                                        <td style={{ padding: '4px 0', color: '#64748b', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap', paddingRight: '15px' }}>Sales Order #:</td>
                                                        <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>{order.so}</td>
                                                      </tr>
                                                      <tr>
                                                        <td style={{ padding: '4px 0', color: '#64748b', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap', paddingRight: '15px' }}>Commission Total:</td>
                                                        <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>{formatCurrency(order.commissionTotal)}</td>
                                                      </tr>
                                                      <tr>
                                                        <td style={{ padding: '4px 0', color: '#64748b', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap', paddingRight: '15px' }}>Commission Paid:</td>
                                                        <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>{formatCurrency(order.commissionPaid)}</td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                  {order.commissionPaymentHistory && order.commissionPaymentHistory.length > 0 && (
                                                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                                                      <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Payment History</h5>
                                                      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', background: 'transparent' }}>
                                                        <tbody>
                                                          {order.commissionPaymentHistory.map((hist, hidx) => {
                                                            const rawDateStr = String(hist.date).split('T')[0];
                                                            
                                                            return (
                                                              <tr key={hidx}>
                                                                <td style={{ padding: '4px 0', color: '#64748b', fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap', paddingRight: '15px' }}>{rawDateStr}</td>
                                                                <td style={{ padding: '4px 0', color: '#0f172a', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>{formatCurrency(hist.amount)}</td>
                                                              </tr>
                                                            );
                                                          })}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  )}
                                                </div>
                                              } 
                                            />
                                          </div>
                                        </td>
                                        <td style={{ padding: '15px 8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {formatCurrency(order.commissionDue)}
                                            <InfoTooltip 
                                              title="Commission Due"
                                              content={
                                                <>
                                                  <p style={{ margin: '0 0 8px 0' }}>The amount of commission currently pending payment to you.</p>
                                                  <p style={{ margin: '0 0 8px 0' }}>Commission is paid in two stages:</p>
                                                  <ol style={{ margin: '0 0 8px 18px', padding: 0 }}>
                                                    <li style={{ marginBottom: '4px' }}><strong>After the customer deposit is received</strong></li>
                                                    <li><strong>After the final customer payment is received</strong></li>
                                                  </ol>
                                                  <p style={{ margin: 0 }}>This reflects what is owed to you right now but has not yet been paid.</p>
                                                </>
                                              }
                                            />
                                          </div>
                                        </td>
                                      </tr>
                                      {isOrderExpanded && (
                                        <tr>
                                          <td colSpan={14} style={{ padding: '15px 24px', backgroundColor: '#f8fafc' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                              {/* Left Column: Notes */}
                                              <div style={{ borderLeft: '4px solid #F05323', paddingLeft: '15px' }}>
                                                <strong style={{ display: 'block', marginBottom: 10, fontSize: '14px', color: '#1e293b' }}>Order Notes:</strong>
                                                {hasNotes ? (
                                                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569' }}>
                                                    {order.notes.map((note, nidx) => (
                                                      <li key={nidx} style={{ marginBottom: 4 }}>{note}</li>
                                                    ))}
                                                  </ul>
                                                ) : (
                                                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No notes for this order.</p>
                                                )}
                                              </div>

                                              {/* Right Column: Files */}
                                              <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '15px' }}>
                                                <strong style={{ display: 'block', marginBottom: 10, fontSize: '14px', color: '#1e293b' }}>Inventory & Files:</strong>
                                                <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                                                  <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Initial</span>
                                                    <span style={{ fontSize: 16, fontWeight: 700 }}>{order.initialInv}</span>
                                                  </div>
                                                  <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Delivered</span>
                                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>{order.deliveredInv}</span>
                                                  </div>
                                                  <div style={{ background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', flex: 1 }}>
                                                    <span style={{ display: 'block', fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Remaining</span>
                                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#ea580c' }}>{order.remainingInv}</span>
                                                  </div>
                                                </div>

                                                <OrderFilesPreview orderId={(order.cmKey || order.so).toLowerCase()} />
                                                
                                                {resolvedCustomerId > 0 && (
                                                  <div style={{ marginTop: 10 }}>
                                                    <AssetVault
                                                      orderId={(order.cmKey || order.so).toLowerCase()}
                                                      customerId={resolvedCustomerId}
                                                      isAdmin={true}
                                                      mode="button"
                                                    />
                                                  </div>
                                                )}
                                                {resolvedCustomerId <= 0 && (
                                                  <p style={{ marginTop: 10, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                                                    Upload unavailable until this order is matched to a WordPress customer.
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

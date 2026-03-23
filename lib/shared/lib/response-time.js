// Simplified response-time utilities for JavaScript compatibility

export function calculateResponseTime(data, options = {}) {
  const {
    timeframe = '24h',
    includeMessages = true,
    includeOrders = true,
    timezone = 'Africa/Nairobi'
  } = options;

  try {
    if (!data || !data.orders && !data.messages) {
      return {
        averageMinutes: 0,
        formattedString: '0 min',
        sampleCount: 0,
        breakdown: {
          orders: { count: 0, avgMinutes: 0 },
          messages: { count: 0, avgMinutes: 0 }
        }
      };
    }

    let orderTimes = [];
    let messageTimes = [];

    // Calculate order response times
    if (includeOrders && data.orders) {
      orderTimes = data.orders
        .filter(order => order.confirmed_at && order.created_at)
        .map(order => {
          const created = new Date(order.created_at);
          const confirmed = new Date(order.confirmed_at);
          return (confirmed - created) / (1000 * 60); // Convert to minutes
        });
    }

    // Calculate message response times
    if (includeMessages && data.messages) {
      messageTimes = data.messages
        .filter(msg => msg.staff_acknowledged_at && msg.created_at)
        .map(msg => {
          const created = new Date(msg.created_at);
          const acknowledged = new Date(msg.staff_acknowledged_at);
          return (acknowledged - created) / (1000 * 60); // Convert to minutes
        });
    }

    // Combine all times
    const allTimes = [...orderTimes, ...messageTimes];
    
    if (allTimes.length === 0) {
      return {
        averageMinutes: 0,
        formattedString: '0 min',
        sampleCount: 0,
        breakdown: {
          orders: { count: orderTimes.length, avgMinutes: 0 },
          messages: { count: messageTimes.length, avgMinutes: 0 }
        }
      };
    }

    // Calculate averages
    const avgOrderTime = orderTimes.length > 0 
      ? orderTimes.reduce((sum, time) => sum + time, 0) / orderTimes.length 
      : 0;
    
    const avgMessageTime = messageTimes.length > 0 
      ? messageTimes.reduce((sum, time) => sum + time, 0) / messageTimes.length 
      : 0;
    
    const overallAvg = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;

    return {
      averageMinutes: Math.round(overallAvg * 10) / 10, // Round to 1 decimal
      formattedString: formatResponseTime(overallAvg),
      sampleCount: allTimes.length,
      breakdown: {
        orders: { count: orderTimes.length, avgMinutes: Math.round(avgOrderTime * 10) / 10 },
        messages: { count: messageTimes.length, avgMinutes: Math.round(avgMessageTime * 10) / 10 }
      }
    };
  } catch (error) {
    console.error('Error calculating response time:', error);
    return {
      averageMinutes: 0,
      formattedString: '0 min',
      sampleCount: 0,
      breakdown: {
        orders: { count: 0, avgMinutes: 0 },
        messages: { count: 0, avgMinutes: 0 }
      },
      error: error.message
    };
  }
}

export function formatResponseTime(minutes) {
  if (minutes < 1) {
    return '< 1 min';
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

export function formatResponseTimeDetailed(minutes) {
  if (minutes < 1) {
    return 'Less than 1 minute';
  } else if (minutes < 60) {
    return `${Math.round(minutes)} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
}

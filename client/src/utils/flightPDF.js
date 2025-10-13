import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import qrcode from 'qrcode';

export const generateFlightPDF = async (booking) => {
  // Flight display
  const flightDisplay =
    booking?.airline && booking?.flightNumber
      ? `${booking.airline} ${booking.flightNumber}`
      : (booking?.flightNumber || booking?.airline || 'TBD');

  // Prefer explicit codes; else derive safely from city
  const originCode =
    booking?.originAirportCode ??
    booking?.origin?.slice(0, 3)?.toUpperCase?.() ??
    '---';

  const destinationCode =
    booking?.destinationAirportCode ??
    booking?.destination?.slice(0, 3)?.toUpperCase?.() ??
    '---';

  const originCity = booking?.origin || '';
  const destinationCity = booking?.destination || '';

  const qrCodeDataURL = await qrcode.toDataURL(booking?.ticketCode || booking?.id || 'N/A', {
    width: 120,
    margin: 1,
    color: { dark: '#111827', light: '#0000' }
  });

  const passengers = Array.isArray(booking?.passengers) ? booking.passengers : [];

  const passengerListHTML = passengers.map((p, index) => `
    <div style="padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
      <p style="margin:0; font-weight:600; font-size:14px; color:#1f2937;">${[p?.firstName, p?.lastName].filter(Boolean).join(' ')}</p>
      <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">
        Seat: <span style="font-weight:600;">${(booking?.selectedSeats || [])[index] || 'N/A'}</span>
      </p>
    </div>
  `).join('');

  const ticketElement = document.createElement('div');
  ticketElement.style.width = '800px';
  ticketElement.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  ticketElement.style.color = '#374151';
  ticketElement.style.background = 'white';
  ticketElement.style.padding = '10px';

  ticketElement.innerHTML = `
    <div style="width:100%; display:flex; border-radius:16px; overflow:hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05);">
      <div style="flex-grow:1; background-color:#f9fafb; padding:24px;">
        <div style="background-image: linear-gradient(to right, #4f46e5, #6366f1); color:white; padding:20px; margin:-24px -24px 24px -24px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h1 style="font-size:24px; font-weight:bold; margin:0;">TravelEase</h1>
            <p style="font-size:14px; font-weight:500; margin:0; opacity:.9;">FLIGHT BOARDING PASS</p>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <div style="text-align:left;">
            <p style="font-size:48px; font-weight:bold; color:#111827; margin:0; line-height:1;">${originCode}</p>
            <p style="font-size:14px; color:#6b7280; margin:4px 0 0;">${originCity}</p>
          </div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color:#9ca3af;">
            <path d="M21.25 12H2.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21.25 12L17 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21.25 12L17 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.75 12H21.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 8L2.75 12L7 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div style="text-align:right;">
            <p style="font-size:48px; font-weight:bold; color:#111827; margin:0; line-height:1;">${destinationCode}</p>
            <p style="font-size:14px; color:#6b7280; margin:4px 0 0;">${destinationCity}</p>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; border-top:1px solid #e5e7eb; padding-top:20px; margin-bottom:24px; text-align:left;">
          <div>
            <p style="font-size:12px; color:#6b7280; margin:0;">Flight</p>
            <p style="font-size:14px; font-weight:600; color:#1f2937; margin:2px 0 0;">${flightDisplay}</p>
          </div>
          <div>
            <p style="font-size:12px; color:#6b7280; margin:0;">Date</p>
            <p style="font-size:14px; font-weight:600; color:#1f2937; margin:2px 0 0;">${booking?.departureDate || ''}</p>
          </div>
          <div>
            <p style="font-size:12px; color:#6b7280; margin:0;">Departure</p>
            <p style="font-size:14px; font-weight:600; color:#1f2937; margin:2px 0 0;">${booking?.departureTime ?? 'TBD'}</p>
          </div>
          <div>
            <p style="font-size:12px; color:#6b7280; margin:0;">Gate</p>
            <p style="font-size:14px; font-weight:600; color:#1f2937; margin:2px 0 0;">${booking?.gate ?? 'TBD'}</p>
          </div>
        </div>

        <div>
          <p style="font-size:12px; text-transform:uppercase; letter-spacing:.5px; color:#6b7280; margin:0 0 10px;">Passenger</p>
          ${passengerListHTML}
        </div>
      </div>

      <div style="flex-shrink:0; width:250px; background-color:#ffffff; border-left:2px dashed #d1d5db; padding:24px; text-align:center; display:flex; flex-direction:column; justify-content:center;">
        <p style="font-size:14px; color:#6b7280; margin:0 0 8px;">Scan at boarding gate</p>
        <img src="${qrCodeDataURL}" alt="QR Code" style="width:120px; height:120px; margin:0 auto;" />
        <p style="font-family:'SF Mono','Courier New',monospace; font-size:18px; font-weight:600; color:#1f2937; margin:16px 0 0;">${booking?.ticketCode || 'N/A'}</p>
        <p style="font-size:12px; color:#6b7280; margin:4px 0 0;">Booking Reference</p>
        <div style="border-top:1px solid #e5e7eb; margin:24px 0;"></div>
        <div style="text-align:left; font-size:12px;">
          <p style="margin:0 0 12px;"><span style="color:#6b7280;">Class:</span><br><strong style="font-size:14px; color:#1f2937; text-transform:capitalize;">${booking?.class || 'Economy'}</strong></p>
          <p style="margin:0;"><span style="color:#6b7280;">Seat:</span><br><strong style="font-size:14px; color:#1f2937;">${(booking?.selectedSeats || []).join(', ') || 'N/A'}</strong></p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(ticketElement);
  try {
    const canvas = await html2canvas(ticketElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const targetWidthMM = 6 * 25.4;
    const targetHeightMM = 3 * 25.4;

    const a4Width = pdf.internal.pageSize.getWidth();
    const a4Height = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, a4Width, a4Height, 'F');

    const xOffset = (a4Width - targetWidthMM) / 2;
    const yOffset = (a4Height - targetHeightMM) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, targetWidthMM, targetHeightMM);
    pdf.save(`TravelEase-Flight-Ticket-${booking?.ticketCode || booking?.id || 'ticket'}.pdf`);
  } finally {
    document.body.removeChild(ticketElement);
  }
};

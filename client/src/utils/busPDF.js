import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import qrcode from 'qrcode';

export const generateBusPDF = async (booking) => {
    // Intelligently parse the route from different possible data fields.
    let origin = 'N/A';
    let destination = 'N/A';

    if (booking.origin && booking.destination) {
        origin = booking.origin;
        destination = booking.destination;
    } else if (booking.routeName) {
        const routeParts = booking.routeName.split(/ to /i);
        if (routeParts.length === 2) {
            origin = routeParts[0].trim();
            destination = routeParts[1].trim();
        } else {
            origin = booking.routeName;
        }
    }

    const originFontSize = origin === 'N/A' ? '28px' : '36px';
    const destinationFontSize = destination === 'N/A' ? '28px' : '36px';

    const qrCodeDataURL = await qrcode.toDataURL(booking.ticketCode || 'N/A', {
        width: 120,
        margin: 1,
        color: {
            dark: '#111827',
            light: '#0000'
        }
    });

    const passengers = booking.passengers || [];

    const passengerListHTML = passengers.map((p, index) => `
        <div style="padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
            <p style="margin: 0; font-weight: 600; font-size: 14px; color: #1f2937;">${index + 1}. ${p.firstName} ${p.lastName}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Seat: <span style="font-weight: 600;">${booking.selectedSeats[index] || 'N/A'}</span></p>
        </div>
    `).join('');

    const ticketElement = document.createElement('div');
    ticketElement.style.width = '800px';
    ticketElement.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    ticketElement.style.color = '#374151';
    ticketElement.style.background = 'white';
    ticketElement.style.padding = '10px';

    ticketElement.innerHTML = `
        <div style="width: 100%; display: flex; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
            <div style="flex-grow: 1; background-color: #f9fafb; padding: 24px;">
                <div style="background-image: linear-gradient(to right, #4f46e5, #6366f1); color: white; padding: 20px; margin: -24px -24px 24px -24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h1 style="font-size: 24px; font-weight: bold; margin: 0;">TravelEase</h1>
                        <p style="font-size: 14px; font-weight: 500; margin: 0; opacity: 0.9;">BUS BOARDING PASS</p>
                    </div>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <div style="text-align: left;">
                        <p style="font-size: 14px; color: #6b7280; margin: 0;">From</p>
                        <p style="font-size: ${originFontSize}; font-weight: bold; color: #111827; margin: 4px 0 0;">${origin}</p>
                    </div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: #6b7280;">
                        <path d="M17.5 12H6.5M14 15.5L17.5 12L14 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div style="text-align: right;">
                        <p style="font-size: 14px; color: #6b7280; margin: 0;">To</p>
                        <p style="font-size: ${destinationFontSize}; font-weight: bold; color: #111827; margin: 4px 0 0;">${destination}</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4f46e5" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V10h14zM7 12h5v5H7z"/></svg>
                        <div>
                            <p style="font-size: 12px; color: #6b7280; margin: 0;">Date</p>
                            <p style="font-size: 14px; font-weight: 600; color: #1f2937; margin: 2px 0 0;">${booking.departureDate}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4f46e5" d="m20 8l-8 5l-8-5v10h16zm0-2H4c-1.1 0-2 .9-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2"/></svg>
                        <div>
                            <p style="font-size: 12px; color: #6b7280; margin: 0;">Bus Operator</p>
                            <p style="font-size: 14px; font-weight: 600; color: #1f2937; margin: 2px 0 0;">${booking.operator || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 0 0 10px;">Passenger Details</p>
                    ${passengerListHTML}
                </div>
            </div>

            <div style="flex-shrink: 0; width: 250px; background-color: #ffffff; border-left: 2px dashed #d1d5db; padding: 24px; text-align: center; display: flex; flex-direction: column; justify-content: center;">
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px;">Scan this code to board</p>
                <img src="${qrCodeDataURL}" alt="QR Code" style="width: 120px; height: 120px; margin: 0 auto;" />
                <p style="font-family: 'SF Mono', 'Courier New', monospace; font-size: 18px; font-weight: 600; color: #1f2937; margin: 16px 0 0;">${booking.ticketCode}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Booking Reference</p>
                
                <div style="border-top: 1px solid #e5e7eb; margin: 24px 0;"></div>

                <div style="text-align: left; font-size: 12px;">
                    <p style="margin: 0 0 12px;"><span style="color: #6b7280;">Travelers:</span><br><strong style="font-size: 14px; color: #1f2937;">${booking.travelers}</strong></p>
                    <p style="margin: 0;"><span style="color: #6b7280;">Total Price:</span><br><strong style="font-size: 16px; color: #1f2937;">₹${booking.price.toLocaleString('en-IN')}</strong></p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(ticketElement);

    try {
        const canvas = await html2canvas(ticketElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const targetWidthInches = 6;
        const targetHeightInches = 3;
        const targetWidthMM = targetWidthInches * 25.4;
        const targetHeightMM = targetHeightInches * 25.4;

        const a4Width = pdf.internal.pageSize.getWidth();
        const a4Height = pdf.internal.pageSize.getHeight();

        // --- NEW: Add black background ---
        pdf.setFillColor(0, 0, 0); // Set fill color to black
        pdf.rect(0, 0, a4Width, a4Height, 'F'); // Draw a rectangle covering the whole page

        const xOffset = (a4Width - targetWidthMM) / 2;
        const yOffset = (a4Height - targetHeightMM) / 2;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, targetWidthMM, targetHeightMM);
        pdf.save(`TravelEase-Bus-Ticket-${booking.ticketCode}.pdf`);
    } catch (err) {
        console.error("Error generating PDF: ", err);
        alert("An error occurred while generating the PDF. Please try again.");
    } finally {
        document.body.removeChild(ticketElement);
    }
};
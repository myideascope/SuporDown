# Uptime Monitoring and Alerts

[![Contributors](https://img.shields.io/github/contributors/yourusername/uptime-monitoring?style=for-the-badge)](https://github.com/yourusername/uptime-monitoring/graphs/contributors)
[![Stargazers](https://img.shields.io/github/stars/yourusername/uptime-monitoring?style=for-the-badge)](https://github.com/yourusername/uptime-monitoring/stargazers)
[![Forks](https://img.shields.io/github/forks/yourusername/uptime-monitoring?style=for-the-badge)](https://github.com/yourusername/uptime-monitoring/network/members)
[![Issues](https://img.shields.io/github/issues/yourusername/uptime-monitoring?style=for-the-badge)](https://github.com/yourusername/uptime-monitoring/issues)

A subscription-based monitoring platform that tracks the status of services and devices, sending real-time alerts through multiple channels when outages are detected.

## Features

- **Main Dashboard UI** with status cards showing monitored services/devices with health indicators (green/yellow/red)
- **Alert Configuration Panel** allowing users to set up notification preferences for email, SMS, Slack, webhook integrations, and push notifications
- **Incident Timeline** displaying historical uptime/downtime with filtering capabilities
- **Quick-Add Widget** for rapidly adding new monitoring endpoints with basic configuration
- **Status Badges** that can be embedded on external websites to display current service status

## Built With

- [React](https://reactjs.org/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Stripe](https://stripe.com/) - Payment processing
- [Radix UI](https://www.radix-ui.com/) - Headless UI components
- [React Router](https://reactrouter.com/) - Client-side routing
- [Lucide React](https://lucide.dev/) - Icon library
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager
- Supabase account
- Stripe account (for payment processing)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/uptime-monitoring.git
   cd uptime-monitoring
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory and add:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_PROJECT_ID=your_project_id
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   ```

4. Set up Supabase database
   ```bash
   npm run types:supabase
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) to view it in the browser

### Building for Production

```bash
npm run build
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting a PR

## Top Contributors

<a href="https://github.com/yourusername/uptime-monitoring/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=yourusername/uptime-monitoring" />
</a>

## Contact

Project Link: [https://github.com/yourusername/uptime-monitoring](https://github.com/yourusername/uptime-monitoring)

For support or questions, please open an issue on GitHub.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgements

- [Tempo](https://tempo.build/) - For providing an amazing development platform that made building this project seamless
- [Supabase](https://supabase.com/) - For the powerful backend infrastructure and real-time capabilities
- [Stripe](https://stripe.com/) - For reliable payment processing and subscription management
- [Radix UI](https://www.radix-ui.com/) - For accessible and customizable UI components
- [Tailwind CSS](https://tailwindcss.com/) - For the utility-first CSS framework
- [React](https://reactjs.org/) - For the robust frontend framework
- All the amazing open source contributors who made this project possible

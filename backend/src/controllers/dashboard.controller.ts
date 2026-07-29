import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
  async getMetrics(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [
        totalEvents,
        eventsToday,
        criticalAlerts,
        highAlerts,
        mediumAlerts,
        lowAlerts,
        openIncidents,
        investigatingIncidents,
        resolvedIncidents,
        activeAgents,
        offlineAgents,
      ] = await Promise.all([
        prisma.securityEvent.count(),
        prisma.securityEvent.count({
          where: {
            timestamp: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        prisma.alert.count({
          where: { severity: 'CRITICAL' },
        }),
        prisma.alert.count({
          where: { severity: 'HIGH' },
        }),
        prisma.alert.count({
          where: { severity: 'MEDIUM' },
        }),
        prisma.alert.count({
          where: { severity: 'LOW' },
        }),
        prisma.incident.count({
          where: { status: 'OPEN' },
        }),
        prisma.incident.count({
          where: { status: 'INVESTIGATING' },
        }),
        prisma.incident.count({
          where: { status: 'CLOSED' },
        }),
        prisma.agent.count({
          where: { status: 'ONLINE' },
        }),
        prisma.agent.count({
          where: { status: 'OFFLINE' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalEvents,
          eventsToday,
          criticalAlerts,
          highAlerts,
          mediumAlerts,
          lowAlerts,
          openIncidents,
          investigatingIncidents,
          resolvedIncidents,
          activeAgents,
          offlineAgents,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard metrics',
      });
    }
  }

  async getAlertSeverityDistribution(req: Request, res: Response) {
    try {
      const severityCounts = await prisma.alert.groupBy({
        by: ['severity'],
        _count: {
          severity: true,
        },
        where: {
          status: {
            notIn: ['RESOLVED', 'FALSE_POSITIVE'],
          },
        },
      });

      const data = severityCounts.map((item) => ({
        severity: item.severity || 'UNKNOWN',
        count: item._count.severity,
      }));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error fetching severity distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch severity distribution',
      });
    }
  }

  async getEventsTimeline(req: Request, res: Response) {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now);
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const events = await prisma.securityEvent.findMany({
        where: {
          timestamp: {
            gte: twentyFourHoursAgo,
            lte: now,
          },
        },
        select: {
          timestamp: true,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Initialize all 24 hours with 0 events
      const hourMap = new Map<string, number>();
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        hourMap.set(`${hour}:00`, 0);
      }

      // Fill in actual event counts
      events.forEach((event) => {
        const hour = event.timestamp.getHours();
        const key = `${hour.toString().padStart(2, '0')}:00`;
        hourMap.set(key, (hourMap.get(key) || 0) + 1);
      });

      // Convert to array and sort by time
      const data = Array.from(hourMap.entries())
        .map(([time, events]) => ({
          time,
          events,
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error fetching events timeline:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch events timeline',
      });
    }
  }

  async getTopSources(req: Request, res: Response) {
    try {
      const topSources = await prisma.securityEvent.groupBy({
        by: ['sourceIp'],
        _count: {
          sourceIp: true,
        },
        where: {
          sourceIp: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            sourceIp: 'desc',
          },
        },
        take: 10,
      });

      // Fixed: Handle potential null values with nullish coalescing
      const data = topSources.map((item) => ({
        source: item.sourceIp ?? 'Unknown',
        count: item._count.sourceIp,
      }));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error fetching top sources:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch top sources',
      });
    }
  }
}
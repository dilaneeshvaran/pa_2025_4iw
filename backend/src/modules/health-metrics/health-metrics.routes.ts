import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { healthMetricsController } from './health-metrics.controller';
import { authenticate } from '../../middleware/authenticate';
import { sanitizeErrorMessage } from '../../utils/errors';

export async function healthMetricsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return await healthMetricsController.recordMetric(request, reply);
      } catch (error) {
        request.log.error(error);
        const message = sanitizeErrorMessage(error, "Erreur lors de l'enregistrement de l'indicateur de santé");
        return reply.status(400).send({ success: false, message });
      }
    }
  );

  fastify.get(
    '/latest',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return await healthMetricsController.getLatestMetrics(request, reply);
      } catch (error) {
        request.log.error(error);
        const message = sanitizeErrorMessage(error, 'Erreur lors de la récupération des indicateurs de santé');
        return reply.status(400).send({ success: false, message });
      }
    }
  );

  fastify.get(
    '/history/:type',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return await healthMetricsController.getMetricHistory(request, reply);
      } catch (error) {
        request.log.error(error);
        const message = sanitizeErrorMessage(error, "Erreur lors de la récupération de l'historique");
        return reply.status(400).send({ success: false, message });
      }
    }
  );

  fastify.delete(
    '/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        return await healthMetricsController.removeMetric(request, reply);
      } catch (error) {
        request.log.error(error);
        const message = sanitizeErrorMessage(error, "Erreur lors de la suppression de l'indicateur de santé");
        return reply.status(400).send({ success: false, message });
      }
    }
  );
}

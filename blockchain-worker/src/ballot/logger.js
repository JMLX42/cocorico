import bunyan from 'bunyan';
import cluster from 'cluster';

export default bunyan.createLogger({name: 'ballot-consumer-' + cluster.worker.id});

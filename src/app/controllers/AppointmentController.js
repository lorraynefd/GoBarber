import Appointment from '../models/Appointments';
import * as Yup from 'yup';
import User from '../models/User';

class AppointmentController {
    async store (req, res){
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });
        if(!(await schema.isValid(req.body))){
            return res.status(408).json({ error: 'Validação falsa' });
        }
        const { provider_id, date } = req.body;
        const isProvider = await User.findOne({
            where: { id: provider_id, provider: true},
        });
        if (!isProvider){
            return res
            .status(401)
            .json({ error: ' Você só pode criar compromissos com provedores'})
        }

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date,
        });
        return res.json(appointment);
    }
}

export default new AppointmentController();
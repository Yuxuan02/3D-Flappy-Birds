import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;
class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

export class Bird extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            cube: new Cube(),
            sun: new defs.Subdivision_Sphere(4),
        };
        // *** Materials
        this.materials = {
            plastic: new Material(
                new defs.Phong_Shader(),
                {
                    ambient: .4,
                    diffusivity: .6,
                    color: hex_color("#ffffff")
                }),
        }
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("View solar system", ["Control", "0"], () => this.attached = () => this.initial_camera_location);
        this.new_line();
        this.key_triggered_button("Attach to planet 1", ["Control", "1"], () => this.attached = () => this.planet_1);
        this.key_triggered_button("Attach to planet 2", ["Control", "2"], () => this.attached = () => this.planet_2);
        this.new_line();
        this.key_triggered_button("Attach to planet 3", ["Control", "3"], () => this.attached = () => this.planet_3);
        this.key_triggered_button("Attach to planet 4", ["Control", "4"], () => this.attached = () => this.planet_4);
        this.new_line();
        this.key_triggered_button("Attach to moon", ["Control", "m"], () => this.attached = () => this.moon);
    }

    draw_box(context, program_state, model_transform, color) {
        this.shapes.cube.draw(context, program_state, model_transform, this.materials.plastic.override({color:color}));
    }

    draw_wings(context, program_state, model_transform) {
        const left_wing = model_transform.times(Mat4.translation(-1.15, -0.4, -0.4))
                                         .times(Mat4.scale(0.2, 0.6,0.8));
        const right_wing = model_transform.times(Mat4.translation(1.15, -0.4, -0.4))
                                          .times(Mat4.scale(0.2, 0.6,0.8));
        this.shapes.cube.draw(context, program_state, left_wing, this.materials.plastic.override({color:color(1,1,1,1)}));
        this.shapes.cube.draw(context, program_state, right_wing, this.materials.plastic.override({color:color(1,1,1,1)}));
    }

    draw_mouth(context, program_state, model_transform) {
        const lip_color = hex_color("#FE9800");
        const upper_lip = model_transform.times(Mat4.translation(0, 0, 1))
                                         .times(Mat4.scale(1.1, 0.2, 1)); 
        const lower_lip = model_transform.times(Mat4.translation(0, -0.3, 0.7))
                                         .times(Mat4.scale(1.05, 0.2, 1)); 
        this.shapes.cube.draw(context, program_state, upper_lip, this.materials.plastic.override({color:lip_color}));
        this.shapes.cube.draw(context, program_state, lower_lip, this.materials.plastic.override({color:lip_color}));
    }

    draw_eye(context, program_state, model_transform) {
        const white = hex_color("#FFFFFF");
        const black = hex_color("#000000");
        // right eye
        const right_bg_transform = model_transform.times(Mat4.translation(-0.75,0.55,0.7))
                                            .times(Mat4.scale(0.1,0.5,0.3));
        const right_pupil_transform = model_transform.times(Mat4.translation(-0.8,0.6,0.7))
                                            .times(Mat4.scale(0.1,0.3,0.15));
        this.shapes.cube.draw(context, program_state, right_bg_transform, this.materials.plastic.override({color:white}));
        this.shapes.cube.draw(context, program_state, right_pupil_transform, this.materials.plastic.override({color:black}));
        // left eye
        const left_bg_transform = model_transform.times(Mat4.translation(0.75,0.55,0.7))
                                                 .times(Mat4.scale(0.1,0.5,0.3));
        const left_pupil_transform = model_transform.times(Mat4.translation(0.8,0.6,0.7))
                                                 .times(Mat4.scale(0.1,0.3,0.15)); 
        this.shapes.cube.draw(context, program_state, left_bg_transform, this.materials.plastic.override({color:white}));
        this.shapes.cube.draw(context, program_state, left_pupil_transform, this.materials.plastic.override({color:black}));
    }

    draw_bird(context, program_state, model_transform) {
        const body_transform = model_transform.times(Mat4.scale(0.8,1,1.2));
        const yellow = hex_color("#F9DC35");
        this.draw_box(context, program_state, body_transform, yellow);
        this.draw_wings(context, program_state, model_transform);
        this.draw_mouth(context, program_state, model_transform);
        this.draw_eye(context, program_state, model_transform);
    }


    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -10).times(Mat4.rotation(Math.PI/2,0, 1, 0)));
        }
        const matrix_transform = Mat4.identity();
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);
        this.draw_bird(context, program_state, matrix_transform);
    }

}

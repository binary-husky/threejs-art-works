import numpy as np
import random, time, os
from scipy.integrate import ode
from UTILS.tensor_ops import distance_matrix, repeat_at, delta_matrix
from VISUALIZE.mcom import mcom

PI = np.pi
def run():
    # 可视化界面初始化
    可视化桥 = mcom(path='RECYCLE/v2d_logger/', draw_mode='Threejs')
    可视化桥.初始化3D()
    可视化桥.设置样式('creative', selection='creative_v4')
    可视化桥.空指令()
    可视化桥.结束关键帧()


if __name__ == "__main__":
    run()
    time.sleep(10000)
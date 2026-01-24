import * as multer from 'multer';
import * as fs from 'fs';

//diskStorage 是磁盘存储引擎，它接收一个对象，其中包含两个核心函数：destination 和 filename。
//destination (决定存哪)
//filename (决定叫什么)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      fs.mkdirSync('uploads', { recursive: true });
    } catch (e) {
      console.log(e);
    }
    //cb (Callback)Multer 内部的一个“信号函数”,这是一个 Multer 预先定义好的内部函数。
    // cb (error, destination) 它是一个回调函数，用于通知 Multer 存储引擎文件存储的位置。
    // 第一个参数 error 用于传递错误信息（如果有），第二个参数 destination 则是文件最终存储的目录路径。
    // 你需要调用 cb(null, 'uploads') 来告诉 Multer 文件应该存储在 uploads 目录下。
    // 而如果发生错误（比如目录创建失败），你可以调用 cb(error) 来通知 Multer 并停止文件上传。
    //为什么给你：因为文件写入硬盘是异步的。Multer 必须等你把路径选好（执行完 mkdirSync）并通知它，它才敢开始写数据。
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      '-' +
      //originalname 它是指用户在自己电脑（客户端）上选择文件时的完整文件名
      file.originalname;
    cb(null, uniqueSuffix);
  },
});

export { storage };
